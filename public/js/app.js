var app = angular.module('app', ['canvasExt']);
app.config( [
    '$compileProvider',
    function( $compileProvider )
    {   
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|local|data):/);
    }
]);