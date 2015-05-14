/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 * 
 * app directives
 * 
 */

(function () {
'use strict';

angular.module('flexvolt.directives', [])
// to grab the values from range inputs (it converts them to strings) and convert them back to numbers
.directive('numericbinding', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            model: '=ngModel'
        },                
       link: function (scope, element, attrs, ngModelCtrl) {
           if (scope.model && typeof scope.model === 'string') {
               scope.model = parseInt(scope.model);
           }                  
        }
    };
})
.directive('integer', function(){
    return {
        require: 'ngModel',         
        link: function(scope, ele, attr, ctrl){
            ctrl.$parsers.unshift(function(viewValue){
                return parseInt(viewValue, 10);
            });
        }
    };
})
.directive('connectionStatus', function(){
    return {
        restrict: 'E',
        controller: function($scope, flexvolt){
//            $scope.isFlexVoltConnected = flexvolt.isConnected;
            $scope.isFlexVoltConnected = flexvolt.getConnectionStatus;
    
//            $scope.$watch(
//                flexvolt.getConnectionStatus,
//                function(){$scope.isFlexVoltConnected = flexvolt.getConnectionStatus;},
//                true
//            );
        },
        templateUrl: 'templates/connection-indicator.html'
    };
})
.directive('settingsPopover', function(){
    return {
        restrict: 'E',
        template: '<button class="button button-icon" ng-click="popover.show($event)"><i class="icon ion-gear-b dark"></i></button>'
    };
})
.directive('filtersPopover', function(){
    return {
        restrict: 'E',
        template: '<button class="button button-icon" ng-click="filterpopover.show($event)"><i class="icon ion-levels dark"></i></button>'
    };
})
.directive('helpPopover', function(){
    return {
        restrict: 'E',
        template: '<button class="button button-icon" ng-click="helpover.show($event)"><i class="icon ion-help dark"></i></button>'
    };
})


.directive('dftSettings', function(){
    return {
        restrict: 'E',
        templateUrl: 'templates/dftfiltersettings.html'
    };
})
;

}());