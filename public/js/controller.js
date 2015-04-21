angular.module('app').controller('controller',function($scope, $element, $http, canvasHelper){
	$scope.canvas = {
		src : '',
		process: false,
		proType: 't',
		download: null,
		format: 'png',
		watermark: ''
	};

	$scope.process = function ($event) {
		var protype = $event.target.dataset.protype;
		$scope.canvas.protype = protype;
		$scope.canvas.process = true;
	};

	$scope.saveImage = function () {
		var imageURL = $scope.canvas.src,
				imageFormat = $scope.canvas.format;
		$http.post('/users/', {image: imageURL, format: imageFormat})
		.success(function(data, status){
			$scope.canvas.download = '/users/download?filename=' + data;
		}); 
	}

});
