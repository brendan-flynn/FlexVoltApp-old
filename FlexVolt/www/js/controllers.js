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
        scope: $scope,
      }).then(function(popover) {
        $scope.popover = popover;
      });
    var afID;
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    var frameCounts = 0;
    
    xyDot.init('#xyWindow');
        
    function updateAnimate(){
        if (!flexvolt.isConnected){return;}
        var dataIn = flexvolt.getDataParsed();
        if (dataIn === null || dataIn === angular.undefined){return;}

        var n = dataIn[0].length;
        if (n <= 0){return;}

        var x = dataIn[0][n-1];
        var y = dataIn[1][n-1];
        console.log('x:'+x+', y:'+y);

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
    
    paintStep();

})
.controller('CircleCtrl', function($scope, $state, xyDot, $ionicPopover) {
    $ionicPopover.fromTemplateUrl('circle-settings.html', {
        scope: $scope,
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
.controller('GameCtrl', function($scope, $state, $ionicPopover) {
    $ionicPopover.fromTemplateUrl('game-settings.html', {
        scope: $scope,
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

.controller('MyometerCtrl', function($scope, $state, $ionicPopover) {
    $ionicPopover.fromTemplateUrl('myometer-settings.html', {
        scope: $scope,
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

.controller('HRVCtrl', function($scope, $state, $ionicPopover) {
    $ionicPopover.fromTemplateUrl('hrv-settings.html', {
        scope: $scope,
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

.controller('PlotCtrl', function($scope, $state, Friends, $ionicPopover) {
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
        nChannels: 1
    };
    
    $scope.friends = Friends.all();
    $scope.nSignals = 4;
    var colorList = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    
    var afID;
    
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    var mar = 10;
    var margin = {top: mar, right: mar, bottom: mar, left: mar},
          width = 400 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;
    
    function movingPlot(){
        var xPos = 0, startPos = 0;
        var data;
//        var x = d3.scale.linear()
//            .range([0, width])
//            .domain([0, width]);

        var y = d3.scale.linear()
            .range([height, 0])
            .domain([-128, 127]);
    
        var yA = [];
        for (var i = 0; i < $scope.nSignals; i++){
            yA[i] = d3.scale.linear()
                .range([height-i*(height/$scope.nSignals), height-(i+1)*(height/$scope.nSignals)])
                .domain([-128, 127]);
        }
//        yA[0] = d3.scale.linear()
//            .range([height, height/2])
//            .domain([-128, 127]);
//    
//        yA[1] = d3.scale.linear()
//            .range([height/2, 0])
//            .domain([-128, 127]);
    
        var svg = d3.select('#plotWindow').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');    

//        var line = d3.svg.line()
//            .x(function(d,i) { return (startPos + i);})
//            .y(function(d) { return y(d); });

        // this one does NOT work.  it almost appears as though the dummy is incremented between line and .y
        var lineA = [];
//        for (var dummy = 0; dummy < $scope.nSignals; dummy++){
//            lineA[dummy] = d3.svg.line()
//                .x(function(d,i) { return (startPos + i);})
//                .y(function(d) { return yA[dummy](d); });
//        }
        if ($scope.nSignals > 0){
            lineA[0] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[0](d); });
        }
        if ($scope.nSignals > 1){
            lineA[1] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[1](d); });
        }
        if ($scope.nSignals > 2){
            lineA[2] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[2](d); });
        }
        if ($scope.nSignals > 3){
            lineA[3] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[3](d); });
        }
        if ($scope.nSignals > 4){
            lineA[4] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[4](d); });
        }
      
        data = [];
        for (var i = 0; i < $scope.nSignals; i++){ data[i]=[]; }
        for (var i = 0; i < 20; i++){
            for (var j = 0; j < $scope.nSignals; j++){
                data[j].push(256*(Math.random()-0.5));
            }
        }
    
        for (var i = 0; i < $scope.nSignals; i++){
            svg.append('svg:path')
                .attr('class','line')
                .attr('stroke', colorList[i])
                .attr('d', lineA[i](data[i]));
        }
        
        function updateAnimate(){

            data = [];
            for (var i = 0; i < $scope.nSignals; i++){ data[i]=[]; }
            startPos = xPos;
            for (var i = 0; i < 20; i++){
                for (var j = 0; j < $scope.nSignals; j++){
                    data[j].push(256*(Math.random()-0.5));
                }
                xPos++;
                if (xPos >= width){
                    //console.log('clearing');
                    for (var i = 0; i < $scope.nSignals; i++){ data[i]=[]; }
                    xPos = 0;
                    startPos = xPos;
                    svg.selectAll('path.line').remove();
                }
            }
            
            for (var i = 0; i < $scope.nSignals; i++){
                svg.append('svg:path')
                    .attr('class','line')
                    .attr('stroke', colorList[i])
                    .attr('d', lineA[i](data[i]));
            }

        }
        
        function paintStep(timestamp){
            if ($state.current.url === '/plot'){
                afID = window.requestAnimationFrame(paintStep);
                //console.log('repainting '+timestamp);
                updateAnimate();
            }
        }
        
        paintStep();
    }

    movingPlot();
})

.controller('TraceCtrl', function($scope, $state, flexvolt, $ionicPopover) {
    $ionicPopover.fromTemplateUrl('trace-settings.html', {
        scope: $scope,
      }).then(function(popover) {
        $scope.popover = popover;
      });
      
    var afID;
    $scope.nSignals = 4;
    var colorList = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    
    $scope.turnOn = flexvolt.turnDataOn();
    
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    var mar = 10;
    var margin = {top: mar, right: mar, bottom: mar, left: mar},
          width = 600 - margin.left - margin.right,
          height = 200 - margin.top - margin.bottom;
    
    function movingPlot(){
        var xPos = 0, startPos = 0;
        var data;
        
//        var x = d3.scale.linear()
//            .range([0, width])
//            .domain([0, width]);
        var y = [];
        y[0] = d3.scale.linear()
            .range([height, height/2])
            .domain([0, 255]);
    
        y[1] = d3.scale.linear()
            .range([height/2, 0])
            .domain([0, 255]);
    
        var svg = d3.select('#traceWindow').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');    

        var line = [];
        line[0] = d3.svg.line()
            .x(function(d,i) { return (startPos + i);})
            .y(function(d) { return y[0](d); });
    
        line[1] = d3.svg.line()
            .x(function(d,i) { return (startPos + i);})
            .y(function(d) { return y[1](d); });
    
        data = [];
        data[0] = [];
        data[1] = [];
        
        var color = ['red','blue'];
        console.log(color);
    
        for (var i = 0; i < 2; i++){
            svg.append('svg:path')
                .attr('class','line')
                .attr('stroke', color[i])
                .attr('d', line[i](data[i]));
        }

        
        function updateAnimate(){
            if (!flexvolt.isConnected){return;}
            
            var dataIn = flexvolt.getDataParsed();
            
            if (dataIn === null || dataIn === angular.undefined){return;}
            if (dataIn[0].length === 0){return;}
            //console.log('got data');
            //console.log(dataIn);
            
            
            data[0] = dataIn[0];
            data[1] = dataIn[1];
            startPos = xPos;
            for (var i = 0; i < dataIn.length; i++){
                data[i] = dataIn[i];
            }
            
            xPos += data[0].length;
            if (xPos >= width){
                //console.log('clearing');
                data[0] = [];
                data[1] = [];
                xPos = 0;
                startPos = xPos;
                svg.selectAll('path.line').remove();
            }
            //console.log('xPos'+xPos);
            
            for (var i = 0; i < 2; i++){
                svg.append('svg:path')
                    .attr('class','line')
                    .attr('stroke', color[i])
                    .attr('d', line[i](data[i]));
            }
        }
        
        function paintStep(timestamp){
//            console.log('paintStep in Game');
            if ($state.current.url === '/trace'){
                afID = window.requestAnimationFrame(paintStep);
                updateAnimate();
            }
        }
        
        paintStep();
    }

    movingPlot();
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
