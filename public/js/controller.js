angular.module('app').controller('controller',function($scope, $element, $http,canvasHelper){
	$scope.canvas = {
		src : '',
		process: false,
		proType: 't'
	};

	$scope.process = function ($event) {
		var protype = $event.target.dataset.protype;
		$scope.canvas.protype = protype;
		$scope.canvas.process = true;
	};

	$scope.saveImage = function () {
		var imageURL = $scope.canvas.src;
		$http.post('/users/', {image: imageURL})
		.success(function(data, status){
			alert('success');
		}); 
	}

});
