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

	function process(canvas, proType, img) {
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
			ctx.scale(scale, scale);
			ctx.drawImage(img,0,0);
		}
		alert('ok');
		return canvas;
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
	}
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
			protype: '='
		},
		link: function($scope, element, attrs) {
			var canvas = element[0],
					ctx = canvas.getContext('2d');

			$scope.$watch(function() {
				return $scope.src;
			}, function(newVal) {
				var img = loadImage();
				
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
					var img = loadImage();			
					$scope.src = canvasHelper.process(canvas, $scope.protype, img).toDataURL();	//处理后均转为png  格式转换交给后端
					$scope.process = false;
					//$scope.$apply();
				}
			});

			function loadImage() {
				var img = new Image();
				
				img.src = $scope.src;

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