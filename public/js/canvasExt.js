var canvasExt = angular.module('canvasExt',[]);
canvasExt.factory('canvasHelper', function($rootScope){
	
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
		return canvas.toDataURL(type, quality);   //base64
	}
	function fileToDataURI(file, type, quality, callback){
		var imgSrc = URL.createObjectURL(file);

		if (!type) {
      		type = file.type;
    	}
		if(imgSrc && imgSrc != ''){
			var image = new Image();
			image.src = imgSrc;
			image.onload = function(){
				var ctx = createCanvasContext(image.width, image.height);
				ctx.drawImage(image, 0, 0);
				callback(canvasToDataURI(ctx.canvas, type, quality));
				URL.revokeObjectURL(imgSrc);
			};
		}
	}

	return {
		createCanvasContext: createCanvasContext,
		canvasToDataURI: canvasToDataURI,
		fileToDataURI: fileToDataURI
	}
});

canvasExt.directive('fileSrc',function(canvasHelper){
	return {
	    restrict: 'A',
	    scope: {
	      src: '=fileSrc',
	      mimeType: '=?',
	      quality: '=?'
	    },
	    link:function ($scope, element, attrs) {
	    	element.bind('change', function(e){
	    		var file = e.target.files.length ? e.target.files[0] : null;
	    		if(file){
	    			//canvasHelper.fileToDataURI()
	    			canvasHelper.fileToDataURI(file, $scope.mimeType, $scope.quality, updateSrc);
	    		}
	    	});

	    	function updateSrc(src){
	    		$scope.src = src;
        		$scope.$apply();
	    	}
	    }
	}
});
canvasExt.directive('canvasExt',function(canvasHelper){
	return {
		restrict: 'A',
		scope: {
			src: '='
		},
		link: function($scope, element, attrs){
	    	var canvas = element[0],
        	ctx = canvas.getContext('2d');

        	$scope.$watch(function(){
				return $scope.src;
			}, function(newVal){
				var img = new Image();
				img.src = newVal;
				img.onload = function(){
					canvas.width = img.width;
					canvas.height = img.height;
					ctx.drawImage(img, 0, 0);
					/* download file 
					var u = ctx.canvas.toDataURL('image/jpeg',1.0);
					u = u.replace('image/jpeg','image/octet-stream');
					document.location.href = u;
					*/
				}
			});
		}
	}
});