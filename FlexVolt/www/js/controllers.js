angular.module('flexvolt.controllers', [])
.controller('HomeCtrl', function($scope){
    $scope.apps = 
        {  row1:
        
            {
                b1: {
                    icon:"icon ion-home",
                    ref:"home",
                    btnName:"home"
                },
                b2: {
                    icon:"icon ion-ios-pulse-strong",
                    ref:"trace",
                    btnName:"trace"
                },
                b3: {
                    icon:"icon ion-ios-navigate",
                    ref:"xy",
                    btnName:"X-Y"
                },
                b4: {
                    icon:"icon ion-ios-game-controller-b",
                    ref:"game",
                    btnName:"Game"
                }
            },
            row2:
            {    
                b1:{
                    icon:"icon ion-speedometer",
                    ref:"myometer",
                    btnName:"Myometer"
                },
                b2:{
                    icon:"icon ion-ios-heart",
                    ref:"hrv",
                    btnName:"HRV"

                },
                b3:{
                    icon:"icon ion-model-s",
                    ref:"home",
                    btnName:"Drive"
                },
                b4:{
                    icon:"icon ion-leaf",
                    ref:"home",
                    btnName:"Relax"                 
                }
            },
            row3:{   
                b1:{
                    icon:"icon ion-nuclear",
                    ref:"home",
                    btnName:"activity"
                },
                b2:{
                    icon:"icon ion-ios-infinite",
                    ref:"home",
                    btnName:"mind"
                },
                b3:{
                    icon:"icon ion-ios-body",
                    ref:"home",
                    btnName:"excercise"
                },
                b4:{
                    icon:"icon ion-ios-game-controller-b",
                    ref:"home",
                    btnName:"controller"
                }
            },
            row4:{   
                b1:{
                    icon:"icon ion-navigate",
                    ref:"circle",
                    btnName:"test"
                },
                b2:{
                    icon:"icon ion-ios-pulse",
                    ref:"plot",
                    btnName:"test"
                },
                b3:{
                    icon:"icon ion-help",
                    ref:"help",
                    btnName:"Help"
                },
                b4:{
                    icon:"icon ion-settings",
                    ref:"settings",
                    btnName:"Connection"
                }
            }
        };
})
.controller('XYCtrl', function($scope, $state, flexvolt, xyDot, $ionicPopover) {
    $ionicPopover.fromTemplateUrl('xy-settings.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
      });
    var afID;
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    var frameCounts = 0;
        
    function updateAnimate(){
        if (!flexvolt.isConnected){return;}
        var dataIn = flexvolt.getDataParsed();
        if (dataIn === null || dataIn === angular.undefined){return;}

        var n = dataIn[0].length;
        if (n <= 0){return;}

        var x = dataIn[0][n-1];
        var y = dataIn[1][n-1];
        //console.log('x:'+x+', y:'+y);

        xyDot.update(x,y);
    }
    
    function paintStep(timestamp){
        if ($state.current.url === '/xy'){
            afID = window.requestAnimationFrame(paintStep);
            frameCounts++;
            if (frameCounts > 5){
                frameCounts = 0;
                updateAnimate();
            }
        }
    }
    
    xyDot.init('#xyWindow');
    flexvolt.turnDataOn();
    paintStep();

})
.controller('CircleCtrl', function($scope, $state, xyDot, $ionicPopover) {
    $ionicPopover.fromTemplateUrl('circle-settings.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
      });
    var afID;
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    var frameCounts = 0;
    var speed = 4;
    var x = 128, y = 128;
    
    xyDot.init('#circleWindow');
        
    function updateAnimate(){
        x = Math.min(Math.max(x+speed*(Math.random()-0.5),0),256);
        y = Math.min(Math.max(y+speed*(Math.random()-0.5),0),256);
        xyDot.update(x,y);
    }
    
    function paintStep(timestamp){
        if ($state.current.url === '/circle'){
            afID = window.requestAnimationFrame(paintStep);
            frameCounts++;
            if (frameCounts > 5){
                frameCounts = 0;
                updateAnimate();
            }
        }
    }
    
    paintStep();
})
.controller('GameCtrl', function($scope, $state, $ionicPopover, flexvolt) {
    $ionicPopover.fromTemplateUrl('game-settings.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
      });
    var afID;
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    function updateAnimate(){
    }
    
    function paintStep(timestamp){
        if ($state.current.url === '/game'){
            afID = window.requestAnimationFrame(paintStep);
            //console.log('repainting '+timestamp);
            updateAnimate();
        }
    }

    paintStep();
})

.controller('MyometerCtrl', function($scope, $state, $ionicPopover, flexvolt) {
    $ionicPopover.fromTemplateUrl('myometer-settings.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
      });
    var afID;
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    function updateAnimate(){
    }
    
    function paintStep(timestamp){
        if ($state.current.url === '/myometer'){
            afID = window.requestAnimationFrame(paintStep);
            //console.log('repainting '+timestamp);
            updateAnimate();
        }
    }

    paintStep();
})

.controller('HRVCtrl', function($scope, $state, $ionicPopover, flexvolt) {
    $ionicPopover.fromTemplateUrl('hrv-settings.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
      });
    var currentUrl = $state.current.url;
    var afID;
    console.log('currentUrl = '+currentUrl);
    
    function updateAnimate(){
    }
    
    function paintStep(timestamp){
        if ($state.current.url === '/hrv'){
            afID = window.requestAnimationFrame(paintStep);
            //console.log('repainting '+timestamp);
            updateAnimate();
        }
    }

    paintStep();
})

.controller('PlotCtrl', function($scope, $state, $ionicPopover, $timeout, tracePlot) {
    var afID;
    
    $ionicPopover.fromTemplateUrl('plot-settings.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
      });
    
    $scope.channelList = [
        {text: "1", value: 1},
        {text: "2", value: 2},
        {text: "4", value: 4},
        {text: "8", value: 8}
    ];
      
    $scope.data = {
        nChannels: 2
    };
    
    $scope.updating = false;
    
    $scope.onChange = function(){
        if (afID){
          window.cancelAnimationFrame(afID);
        }
        $scope.updating  = true;
        console.log($scope.data.nChannels);
        tracePlot.setN($scope.data.nChannels);
        tracePlot.reset();
        $scope.updating  = false;
        paintStep();
    };
    
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    function updateAnimate(){
        var data = [];
        for (var i = 0; i < $scope.data.nChannels; i++){ data[i]=[]; }
        for (var i = 0; i < 20; i++){
            for (var j = 0; j < $scope.data.nChannels; j++){
                data[j].push(256*(Math.random()-0.5));
            }
        }
        tracePlot.update(data);
    }
        
    function paintStep(timestamp){
        if ($state.current.url === '/plot' && $scope.updating === false){
            afID = window.requestAnimationFrame(paintStep);
            updateAnimate();
        }
    }
    
    tracePlot.init('#plotWindow',$scope.data.nChannels);
    paintStep();
})

.controller('TraceCtrl', function($scope, $state, flexvolt, $ionicPopover, tracePlot) {
    var afID;
    
    $ionicPopover.fromTemplateUrl('plot-settings.html', {
        scope: $scope
      }).then(function(popover) {
        $scope.popover = popover;
      });
    
    $scope.channelList = [
        {text: "1", value: 1},
        {text: "2", value: 2},
        {text: "4", value: 4},
        {text: "8", value: 8}
    ];
      
    $scope.data = {
        nChannels: 2
    };
    
    $scope.updating = false;
    
    $scope.onChange = function(){
        if (afID){
          window.cancelAnimationFrame(afID);
        }
        $scope.updating  = true;
        tracePlot.setN($scope.data.nChannels);
        tracePlot.reset();
        $scope.updating  = false;
        paintStep();
    };
    
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);

        
    function updateAnimate(){
        if (!flexvolt.isConnected){return;}

        var dataIn = flexvolt.getDataParsed();

        if (dataIn === null || dataIn === angular.undefined){return;}
        if (dataIn[0].length === 0){return;}

        tracePlot.update(dataIn);
    }

    function paintStep(timestamp){
        if ($state.current.url === '/trace' && $scope.updating === false){
            afID = window.requestAnimationFrame(paintStep);
            updateAnimate();
        }
    }
    
    tracePlot.init('#traceWindow',$scope.data.nChannels);
    flexvolt.turnDataOn();
    paintStep();
})

.controller('HelpCtrl', function($scope, $state) {
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    $scope.text = 'Help section 1';
})

.controller('SettingsCtrl', function($scope, $state, flexvolt) {
    $scope.flexvolt = flexvolt;
    window.flexvolt = flexvolt;
    
    $scope.readAll = function(){
        console.log('trying to get data');
        flexvolt.collectAllBytes(function(data){console.log(data);});
    };
    
    $scope.poll = function(){
        console.log('trying to poll');
        flexvolt.pollVersion();
    };
    
    $scope.clearLog = function(){
        flexvolt.debugging.communicationsLog = '';
    };
    
    $scope.getData = function(){
        console.log('trying to get data');
        //var data = flexvolt.getData();
        var data = flexvolt.getData();
        console.log('got:');
        console.log(data);
    };
})
.controller('MainCtrl', function($scope, $state) {
    
    console.log($state);
    
})
;
