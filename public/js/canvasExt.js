var canvasExt = angular.module('canvasExt', []);
canvasExt.factory('canvasHelper', function($rootScope) {
// add
  var layer = [];

  function createCanvasContext(width, height) {
    var canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    return canvas.getContext('2d');
  }

  function canvasToDataURI(canvas, type, quality) {
    if (!type) {
      type = 'image/jpeg';
    }

    if (!quality) {
      quality = 1.0;
    }
    return canvas.toDataURL(type, quality); //base64
  }

  function fileToDataURI(file, type, quality, callback) {
    var imgSrc = URL.createObjectURL(file);

    if (!type) {
      type = file.type;
    }

    if (imgSrc && imgSrc != '') {
      var image = new Image();
      image.src = imgSrc;
      image.onload = function() {
        var ctx = createCanvasContext(image.width, image.height);
        ctx.drawImage(image, 0, 0);
        callback(canvasToDataURI(ctx.canvas, type, quality));
        URL.revokeObjectURL(imgSrc);
      };
    }
  }

  function toGray(imgData) {
    var data = imgData.data;

    for (var i = 0; i < data.length; i += 4) {
      var r = data[i];
      var g = data[i + 1];
      var b = data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = (r + g + b) / 3;
    }

    return imgData;
  }

  function sharp (imgData) {
    var lamta = 0.6,
        data = imgData.data,
        width = imgData.width,
        height = imgData.height;

    for(var i = 0,n = data.length;i < n;i += 4){
      var ii = i / 4;
      var row = parseInt(ii / width);
      var col = ii % width;
      if(row == 0 || col == 0) continue;

      var A = ((row - 1) *  width + (col - 1)) * 4;
      var B = ((row - 1) * width + col) * 4;
      var E = (ii - 1) * 4;

      for(var j = 0;j < 3;j ++){
        var delta = data[i + j] - (data[B + j] + data[E + j] + data[A + j]) / 3;
        data[i + j] += delta * lamta;
      }
    }

    return imgData;
  }

  function invert (imgData) {
    var d = imgData.data;

    for (var i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i+1] = 255 - d[i + 1];
      d[i+2] = 255 - d[i + 2];
    }

    return imgData;
  }

  function process(canvas, proType, img, wmSrc, callback) {
    var ctx = canvas.getContext('2d'),
        data;

    data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    switch (proType) {
      case 'toGray':
        data = toGray(data);
        break;

      case 'sharp':
        data = sharp(data);
        break;

      case 'invert':
        data = invert(data);
        break;
        
      default:
        break;
    }
    ctx.putImageData(data, 0, 0);

    if (proType == 'zoomIn' || proType == 'zoomOut') {
      var scale = 1.5;
      if(proType == 'zoomIn')
        scale = 0.8;
      canvas.width *= scale;
      canvas.height *= scale;
      ctx.save();
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }
    if (proType == 'rotate') {
      var temp = canvas.width;
      canvas.width = canvas.height;
      canvas.height = temp; 
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.rotate(90 * Math.PI / 180);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    } 
    if (proType == 'crop') {
      var select = new Selection(20, 20, 200, 200);
      //add
      layer.push(select);
      select.draw(canvas);

    } else if (proType == 'watermark') {
      var t = new Image();
      t.src = wmSrc;
      t.onload = function (argument) {
        //add
        var watermark = new ImageObj(t, t.width, t.height);
        layer.push(watermark);
        watermark.draw(canvas);
        callback(canvas.toDataURL());
   
      }
    } else {
      layer = [];
      var t = new Image();
      t.src = canvas.toDataURL();
      t.onload = function (argument) {
        var watermark = new ImageObj(t, t.width, t.height);
        layer.push(watermark);
      }
      callback(canvas.toDataURL()); 
    }
    //return canvas;
  }

  //add
  function init (canvas, img, callback) {
    var dragable = false;
    var mwid, mheight;
    var active;

    layer = [];
    layer.push(new ImageObj(img, img.width, img.height));

    canvas.addEventListener('dblclick', function (event) {
      if (active && active.type == 'rect'){
        layer.pop();
        redraw(canvas, layer);
        var t = new Image();
        t.src = canvas.toDataURL();
        t.onload = function (argument) {
          var ctx = canvas.getContext('2d');
          var watermark = new ImageObj(t, t.width, t.height);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.width = active.w;
          canvas.height = active.h;
          ctx.drawImage(t, active.x, active.y, active.w, active.h, 0, 0, active.w, active.h);

          var t2 = new Image();
          t2.src = canvas.toDataURL();
          t2.onload = function (argument) {
            watermark = new ImageObj(t2, t2.width, t2.height);
            layer = [];
            layer.push(watermark);          
          }
          active.type = null;

          callback(canvas.toDataURL());
        }  
      }
      
    },false);

    canvas.addEventListener('mouseup', function (event) {
      dragable = false;
      canvas.style.cursor = 'auto';

      if (active && active.type == 'rect') {
        for (i = 0; i < 4; i++) {
          active.bDrag[i] = false;
        }
        active.px = 0;
        active.py = 0;
      }
    },false);

    canvas.addEventListener('mousedown', function (event) {
      var pos = getMousePos(canvas, event.clientX, event.clientY);

      for (var i = layer.length - 1; i >= 1; i--) {
        var watermark = layer[i];
        if (isInRect(event, canvas, watermark)){
          dragable = true;
          mwid = pos.x - watermark.x;
          mheight = pos.y - watermark.y;
          active = watermark;
          break;
        }
      }

      if (active && active.type == 'rect') {
        active.px = pos.x - active.x;
        active.py = pos.y - active.y;

        if (active.bHover[0]) {
          active.px = pos.x - active.x;
          active.py = pos.y - active.y;
          active.bDrag[0] = true;
        }
        if (active.bHover[1]) {
          active.px = pos.x - active.x - active.w;
          active.py = pos.y - active.y;
          active.bDrag[1] = true;
        }
        if (active.bHover[2]) {
          active.px = pos.x - active.x - active.w;
          active.py = pos.y - active.y - active.h;
          active.bDrag[2] = true;
        }
        if (active.bHover[3]) {
          active.px = pos.x - active.x;
          active.py = pos.y - active.y - active.h;
          active.bDrag[3] = true;
        }
      }

    },false);

    canvas.addEventListener('mousemove', function (event) {
      /*for (var i = layer.length - 1; i >= 1; i--) {
        var watermark = layer[i];
        if (isInRect(event, canvas, watermark)){
          active = watermark;
          break;
        }
      }*/
      if(active && active.type =='rect') {

        var pos = getMousePos(canvas, event.clientX, event.clientY);

        for (var i = 0; i < 4; i++) {
          active.bHover[i] = false;
          active.iCSize[i] = active.csize;
        }

        if (pos.x > active.x - active.csizeh && pos.x < active.x + active.csizeh &&
          pos.y > active.y - active.csizeh && pos.y < active.y + active.csizeh) {
          active.bHover[0] = true;
          active.iCSize[0] = active.csizeh;
          dragable = false;
        }

        if (pos.x > active.x + active.w - active.csizeh && pos.x < active.x + active.w + active.csizeh &&
          pos.y > active.y - active.csizeh && pos.y < active.y + active.csizeh) {
          active.bHover[1] = true;
          active.iCSize[1] = active.csizeh;
          dragable = false;
        }

        if (pos.x > active.x + active.w - active.csizeh && pos.x < active.x + active.w + active.csizeh &&
          pos.y > active.y + active.h - active.csizeh && pos.y < active.y + active.h + active.csizeh) {
          active.bHover[2] = true;
          active.iCSize[2] = active.csizeh;
          dragable = false;
        }

        if (pos.x > active.x - active.csizeh && pos.x < active.x + active.csizeh &&
          pos.y > active.y + active.h-active.csizeh && pos.y < active.y + active.h + active.csizeh) {

          active.bHover[3] = true;
          active.iCSize[3] = active.csizeh;
          dragable = false;
        }

        /*
        
         */
        // in case of dragging of resize cubes
        var iFW, iFH;
        if (active.bDrag[0]) {
          var iFX = pos.x - active.px;
          var iFY = pos.y - active.py;
          iFW = active.w + active.x - iFX;
          iFH = active.h + active.y - iFY;
        }
        if (active.bDrag[1]) {
          var iFX = active.x;
          var iFY = pos.y - active.py;
          iFW = pos.x - active.px - iFX;
          iFH = active.h + active.y - iFY;
        }
        if (active.bDrag[2]) {
          var iFX = active.x;
          var iFY = active.y;
          iFW = pos.x - active.px - iFX;
          iFH = pos.y - active.py - iFY;
        }
        if (active.bDrag[3]) {
          var iFX = pos.x - active.px;
          var iFY = active.y;
          iFW = active.w + active.x - iFX;
          iFH = pos.y - active.py - iFY;
        }

        if (iFW > active.csizeh * 2 && iFH > active.csizeh * 2) {
          active.w = iFW;
          active.h = iFH;

          active.x = iFX;
          active.y = iFY;
        }
      
        active.width = active.w;
        active.height = active.h; 
        

        redraw(canvas, layer);
        callback(canvas.toDataURL());
      }

      if(!dragable)
        return;
      else {
        var pos = getMousePos(canvas, event.clientX, event.clientY);
        canvas.style.cursor = 'move';

        active.x = pos.x - mwid;
        active.y = pos.y - mheight;

        redraw(canvas, layer);
        callback(canvas.toDataURL());
      }
    },false);

  }

  function redraw (canvas, layer) {
    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i <= layer.length - 1; i++) {
      layer[i].draw(canvas);
    };
  }


  function getMousePos (canvas, x, y) {
    var rec = canvas.getBoundingClientRect();
    /*     
    x: evt.clientX - rect.left * (canvas.width / rect.width),
    y: evt.clientY - rect.top * (canvas.height / rect.height)*/
    return {
      x: x - rec.left,
      y: y - rec.top
    }
  }

  function isInRect (event, canvas, rec) {
    var pos = getMousePos(canvas, event.clientX, event.clientY);

    if ((pos.x > rec.x + rec.w) || pos.x < rec.x)
      return false;
    if ((pos.y > rec.y + rec.h) || pos.y < rec.y)
      return false;

    return true;
  }

  //crop select
  function Selection (x, y, width, height) {
    this.x = x;
    this.y = y;
    /*this.currentX = x;
    this.currentY = y;*/
    this.w = width;
    this.h = height;
    this.type = 'rect';

    this.csize = 6; // resize cubes size
    this.csizeh = 10; // resize cubes size (on hover)
    this.iCSize = [this.csize, this.csize, this.csize, this.csize]; // resize cubes sizes
    this.bHover = [false, false, false, false]; // hover statuses
    this.bDrag = [false, false, false, false]; // drag statuses
    //this.bDragAll = false; // drag whole selection

    this.draw = function (canvas) {
      var ctx = canvas.getContext('2d');

      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      // draw resize cubes
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x - this.iCSize[0], this.y - this.iCSize[0], this.iCSize[0] * 2, this.iCSize[0] * 2);
      ctx.fillRect(this.x + this.w - this.iCSize[1], this.y - this.iCSize[1], this.iCSize[1] * 2, this.iCSize[1] * 2);
      ctx.fillRect(this.x + this.w - this.iCSize[2], this.y + this.h - this.iCSize[2], this.iCSize[2] * 2, this.iCSize[2] * 2);
      ctx.fillRect(this.x - this.iCSize[3], this.y + this.h - this.iCSize[3], this.iCSize[3] * 2, this.iCSize[3] * 2);
    };
  }

  //add
  function ImageObj (img, width, height) {
    this.x = 0;
    this.y = 0;
    this.w = width;
    this.h = height;
    this.type = 'img';

    this.draw = function (canvas) {
      var ctx = canvas.getContext('2d');

      ctx.drawImage(img, this.x, this.y);
    }
  }

  return {
    createCanvasContext: createCanvasContext,
    canvasToDataURI: canvasToDataURI,
    fileToDataURI: fileToDataURI,
    init: init,
    //process
    toGray: toGray,
    sharp: sharp,
    invert: invert,
    process: process
  };
});
    
canvasExt.directive('fileSrc', function(canvasHelper) {
  return {
    restrict: 'A',
    scope: {
      src: '=fileSrc',
      mimeType: '=?',
      quality: '=?'
    },
    link: function($scope, element, attrs) {
      element.bind('change', function(e) {
        var file = e.target.files.length ? e.target.files[0] : null;

        if (file) {
          //canvasHelper.fileToDataURI()
          canvasHelper.fileToDataURI(file, $scope.mimeType, $scope.quality, updateSrc);
        }
      });

      function updateSrc(src) {
        $scope.src = src;
        $scope.$apply();
      }
    }
  }
});
canvasExt.directive('canvasExt', function(canvasHelper) {
  return {
    restrict: 'A',
    scope: {
      src: '=',
      process: '=',
      protype: '=',
      watermark: '=',
      dataurl: '='
    },
    link: function($scope, element, attrs) {
      var canvas = element[0],
          ctx = canvas.getContext('2d');

      $scope.$watch(function() {
        return $scope.src;
      }, function(newVal) {
        var img = loadImage($scope.src);
          $scope.dataurl = $scope.src;
        img.onload = function() {
          imageToCanvas(img, canvas);
          /*var u = ctx.canvas.toDataURL('image/jpeg',1.0);
          u = u.replace('image/jpeg','image/octet-stream');
          document.location.href = u;*/
        };
      });

      $scope.$watch(function() {
        return $scope.process;
      }, function(newVal) {
        if (newVal) {   
          var img = loadImage($scope.dataurl);    
          canvasHelper.process(canvas, $scope.protype, img, $scope.watermark, updateSrc); //处理后均转为png  格式转换交给后端
          //$scope.$apply();  //bug
        }
      });

      function updateSrc(src) {
        $scope.process = false;
        $scope.dataurl = src;

        $scope.$apply(); //bug
      }

      function loadImage(src) {
        var img = new Image();
        
        img.src = src;

        return img;
      }

      function imageToCanvas(img, canvas) {
        var ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvasHelper.init(canvas, img, updateSrc);

        return canvas;
      }
    }
  }
});