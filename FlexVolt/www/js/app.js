// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('flexvolt', ['ionic', 'flexvolt.controllers', 'flexvolt.services', 'flexvolt.flexvolt'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    // make sure we have a way to control frame rate
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = (function() {
            return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame || // comment out if FF4 is slow (it caps framerate at ~30fps: https://bugzilla.mozilla.org/show_bug.cgi?id=630127)
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                    window.setTimeout(callback, 1000 / 60);
                    };
                })();
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = (function() {
            return window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
                    window.webkitCancelAnimationFrame;
        })();
    }
    
    function doOnOrientationChange()
    {
        switch(window.orientation) 
        {  
            case -90:
                console.log('-landscape');
                break; 
            case 90:
                console.log('landscape');
                break; 
            default:
                console.log('portrait');
                break; 
        }
    }

//    window.addEventListener('orientationchange', doOnOrientationChange);
    
    window.onresize = function(){ 
        setTimeout(doOnOrientationChange,0);
    };


  });
})
//.config(function($ionicConfigProvider){
//    $ionicConfigProvider.views.maxCache(0);
//})
.config(function($stateProvider, $urlRouterProvider) {
    
  $stateProvider
    .state('home', {
        url: '/',
        templateUrl: 'templates/home.html',
        controller: 'HomeCtrl'
    })
    
    .state('trace', {
        url: '/trace',
        templateUrl: 'templates/trace.html',
        controller: 'TraceCtrl'
    })
    
    .state('xy', {
        url: '/xy',
        templateUrl: 'templates/xy.html',
        controller: 'XYCtrl'
    })
    
    .state('game', {
        url: '/game',
        templateUrl: 'templates/game.html',
        controller: 'GameCtrl'
    })
    
    .state('myometer', {
        url: '/myometer',
        templateUrl: 'templates/myometer.html',
        controller: 'MyometerCtrl'
    })
    
    .state('hrv', {
        url: '/hrv',
        templateUrl: 'templates/hrv.html',
        controller: 'HRVCtrl'
    })
    
    .state('plot', {
        url: '/plot',
        templateUrl: 'templates/plot.html',
        controller: 'PlotCtrl'
    })
    
    .state('circle', {
        url: '/circle',
        templateUrl: 'templates/circle.html',
        controller: 'CircleCtrl'
    })
    
    .state('circle.settings', {
        url: '/circle-settings',
        templateUrl: 'templates/circle-settings.html',
        controller: 'CircleCtrl'
    })

    .state('help', {
        url: '/help',
        templateUrl: 'templates/help.html',
        controller: 'HelpCtrl'
    })


    .state('settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'SettingsCtrl'
    })
 
    ;

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');

});

