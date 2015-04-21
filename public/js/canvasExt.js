var canvasExt = angular.module('canvasExt', []);
canvasExt.factory('canvasHelper', function($rootScope) {

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
			select.draw(canvas);
			drag(canvas, img, select, callback);
		}
		if (proType == 'watermark') {
			var t = new Image();
			t.src = wmSrc;
			t.onload = function (argument) {
				var watermark = t;
				watermark.currentX = 0,
				watermark.currentY = 0;

				ctx.drawImage(watermark, watermark.currentX, watermark.currentY);
				drag(canvas, img, watermark, callback);			
			}
		} else
			callback(canvas.toDataURL());
		//return canvas;
	}

	//drag watermark
	function drag (canvas, img, watermark, callback) {
		var dragable = false;
		var mwid, mheight;

		canvas.addEventListener('dblclick', function (event) {
			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			canvas.width = watermark.w;
			canvas.height = watermark.h;
			ctx.drawImage(img, watermark.x, watermark.y, watermark.w, watermark.h, 0, 0, watermark.w, watermark.h);
			watermark.type = null;
			callback(canvas.toDataURL());
		},false);
		canvas.addEventListener('mouseup', function (event) {
			dragable = false;
			canvas.style.cursor = 'auto';

			if (watermark.type == 'rect') {
				for (i = 0; i < 4; i++) {
            watermark.bDrag[i] = false;
        }
        watermark.px = 0;
        watermark.py = 0;
			}


			//alert(watermark.currentX +'' +watermark.currentY);
		},false);

		canvas.addEventListener('mousedown', function (event) {
			var pos = getMousePos(canvas, event.clientX, event.clientY);
			if (isInRect(event, canvas, watermark)){
				dragable = true;
				mwid = pos.x - watermark.currentX;
				mheight = pos.y - watermark.currentY;
			} 

			/*
			
			 */
			if (watermark.type == 'rect') {
				watermark.px = pos.x - watermark.x;
        watermark.py = pos.y - watermark.y;

        if (watermark.bHover[0]) {
            watermark.px = pos.x - watermark.x;
            watermark.py = pos.y - watermark.y;
            watermark.bDrag[0] = true;
        }
        if (watermark.bHover[1]) {
            watermark.px = pos.x - watermark.x - watermark.w;
            watermark.py = pos.y - watermark.y;
            watermark.bDrag[1] = true;
        }
        if (watermark.bHover[2]) {
            watermark.px = pos.x - watermark.x - watermark.w;
            watermark.py = pos.y - watermark.y - watermark.h;
            watermark.bDrag[2] = true;
        }
        if (watermark.bHover[3]) {
            watermark.px = pos.x - watermark.x;
            watermark.py = pos.y - watermark.y - watermark.h;
            watermark.bDrag[3] = true;
        }
			}

		},false);

		canvas.addEventListener('mousemove', function (event) {
			if(watermark.type =='rect') {

				var pos = getMousePos(canvas, event.clientX, event.clientY);

				for (var i = 0; i < 4; i++) {
					watermark.bHover[i] = false;
					watermark.iCSize[i] = watermark.csize;
				}

				if (pos.x > watermark.x - watermark.csizeh && pos.x < watermark.x + watermark.csizeh &&
					pos.y > watermark.y - watermark.csizeh && pos.y < watermark.y + watermark.csizeh)	{
					watermark.bHover[0] = true;
					watermark.iCSize[0] = watermark.csizeh;
					dragable = false;
				}

				if (pos.x > watermark.x + watermark.w - watermark.csizeh && pos.x < watermark.x + watermark.w + watermark.csizeh &&
					pos.y > watermark.y - watermark.csizeh && pos.y < watermark.y + watermark.csizeh) {
					watermark.bHover[1] = true;
					watermark.iCSize[1] = watermark.csizeh;
					dragable = false;
				}

				if (pos.x > watermark.x + watermark.w - watermark.csizeh && pos.x < watermark.x + watermark.w + watermark.csizeh &&
					pos.y > watermark.y + watermark.h - watermark.csizeh && pos.y < watermark.y + watermark.h + watermark.csizeh) {
					watermark.bHover[2] = true;
					watermark.iCSize[2] = watermark.csizeh;
					dragable = false;
				}

				if (pos.x > watermark.x - watermark.csizeh && pos.x < watermark.x + watermark.csizeh &&
          pos.y > watermark.y + watermark.h-watermark.csizeh && pos.y < watermark.y + watermark.h + watermark.csizeh) {

          watermark.bHover[3] = true;
          watermark.iCSize[3] = watermark.csizeh;
          dragable = false;
        }

        /*
        
         */
        // in case of dragging of resize cubes
        var iFW, iFH;
        if (watermark.bDrag[0]) {
            var iFX = pos.x - watermark.px;
            var iFY = pos.y - watermark.py;
            iFW = watermark.w + watermark.x - iFX;
            iFH = watermark.h + watermark.y - iFY;
        }
        if (watermark.bDrag[1]) {
            var iFX = watermark.x;
            var iFY = pos.y - watermark.py;
            iFW = pos.x - watermark.px - iFX;
            iFH = watermark.h + watermark.y - iFY;
        }
        if (watermark.bDrag[2]) {
            var iFX = watermark.x;
            var iFY = watermark.y;
            iFW = pos.x - watermark.px - iFX;
            iFH = pos.y - watermark.py - iFY;
        }
        if (watermark.bDrag[3]) {
            var iFX = pos.x - watermark.px;
            var iFY = watermark.y;
            iFW = watermark.w + watermark.x - iFX;
            iFH = pos.y - watermark.py - iFY;
        }

        if (iFW > watermark.csizeh * 2 && iFH > watermark.csizeh * 2) {
            watermark.w = iFW;
            watermark.h = iFH;

            watermark.x = iFX;
            watermark.y = iFY;
        }
	
        watermark.width = watermark.w;
				watermark.height = watermark.h;	
				

				redraw(canvas, img, watermark);
			}

			if(!dragable)
				return;
			else {
				var pos = getMousePos(canvas, event.clientX, event.clientY);
				canvas.style.cursor = 'move';

				watermark.currentX = pos.x - mwid;
				watermark.currentY = pos.y - mheight;

				if(watermark.type == 'rect') {
					watermark.x = watermark.currentX;
					watermark.y = watermark.currentY;
					watermark.width = watermark.w;
					watermark.height = watermark.h;	
				}
				redraw(canvas, img, watermark);
			}
			/*
			
			 */

			/*
			
			 */

			callback(canvas.toDataURL());
		},false);
	}

	function redraw (canvas, img, watermark) {
		var ctx = canvas.getContext('2d');

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);
		if (watermark.type == 'rect')
			watermark.draw(canvas);
		else
			ctx.drawImage(watermark, watermark.currentX, watermark.currentY);
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

		if ((pos.x > rec.currentX + rec.width) || pos.x < rec.currentX)
			return false;
		if ((pos.y > rec.currentY + rec.height) || pos.y < rec.currentY)
			return false;

		return true;
	}

	//crop select
	function Selection (x, y, width, height) {
		this.x = x;
		this.y = y;
		this.currentX = x;
		this.currentY = y;
		this.w = width;
		this.h = height;
		this.type = 'rect';

	  this.csize = 6; // resize cubes size
    this.csizeh = 10; // resize cubes size (on hover)
		this.iCSize = [this.csize, this.csize, this.csize, this.csize]; // resize cubes sizes
		this.bHover = [false, false, false, false]; // hover statuses
    this.bDrag = [false, false, false, false]; // drag statuses
    this.bDragAll = false; // drag whole selection

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

	

	return {
		createCanvasContext: createCanvasContext,
		canvasToDataURI: canvasToDataURI,
		fileToDataURI: fileToDataURI,
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
					canvasHelper.process(canvas, $scope.protype, img, $scope.watermark, updateSrc);	//处理后均转为png  格式转换交给后端
					//$scope.$apply();	//bug
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

				return canvas;
			}
		}
	}
});