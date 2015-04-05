var canvasExt = angular.module('canvasExt',[]);
canvasExt.directive('fileSrc',function(){
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
	    			console.log("got");
	    		}
	    	});
	    }
	}
});