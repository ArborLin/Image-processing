angular.module('app').controller('controller',function($scope, $element, canvasHelper){
	$scope.canvas = {
		src : '',
		process: false,
		proType: 't'
	};

	$scope.toGray = function ($event) {
		$scope.canvas.protype = 'toGray';
		$scope.canvas.process = true;
	};

	$scope.sharp = function ($event) {
		$scope.canvas.protype = 'sharp';
		$scope.canvas.process = true;
		console.log($scope.canvas.process);
	};
});
