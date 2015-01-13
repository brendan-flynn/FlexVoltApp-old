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
                    btnName:"settings"
                }
            }
        };
})
.controller('XYCtrl', function($scope, $state) {
    var afID;
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    var mar = 10;
    var margin = {top: mar, right: mar, bottom: mar, left: mar},
          width = 600 - margin.left - margin.right,
          height = 200 - margin.top - margin.bottom;
    
    function movingPlot(){
        var dataset = [];
        var svg = d3.select('#xyWindow').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');    
        
        var color = ['red','blue'];
        console.log(color);
        
        dataset[0]={
            x:width/2,
            y:height/2,
            r:20
        };
    
        svg.selectAll('circle')
            .data(dataset)
            .enter().append("circle")
            .style("stroke", "gray")
            .style("fill", "green")
            .attr("r", function(d){return d.r;})
            .attr("cx", function(d){return d.x;})
            .attr("cy", function(d){return d.y;});
        
        function updateAnimate(){
            if (!flexvolt.isConnected){return;}
            
            var dataIn = flexvolt.getDataParsed();
            if (dataIn === null){return;}
            var n = dataIn[0].length;
            if (n === 0){return;}
            //console.log('got data');
            //console.log(dataIn);
            
            dataset[0].x = dataIn[0][n];
            dataset[0].y = dataIn[1][n];

            svg.selectAll('circle').remove();
            svg.selectAll('circle')
                .data(dataset)
                .enter().append("circle")
                .style("stroke", "green")
                .style("fill", "green")
                .attr("r", function(d){return d.r;})
                .attr("cx", function(d){return d.y;})
                .attr("cy", function(d){return d.x;});
        }
        
        function paintStep(timestamp){
            if ($state.current.url === '/xy'){
                afID = window.requestAnimationFrame(paintStep);
                //console.log('repainting '+timestamp);
                updateAnimate();
            }
        }
        
        paintStep();
    }

    movingPlot();
})
.controller('CircleCtrl', function($scope, $state) {
    var afID;
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
    
    var mar = 10;
    var margin = {top: mar, right: mar, bottom: mar, left: mar},
          width = 400 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;
    console.log('w: '+width+', h:'+height);
    
    function movingPlot(){
        var dataset = [];
        var frameCounts = 0;
        var speed = 5;
        var svg = d3.select('#circleWindow').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');    
        
        var color = ['red','blue'];
        console.log(color);
        
        dataset[0]={
            x:width/2,
            y:height/2,
            r:20
        };
        //console.log(dataset);
    
        svg.selectAll('circle')
            .data(dataset)
            .enter().append("circle")
            .style("stroke", "gray")
            .style("fill", "green")
            .attr("r", function(d){return d.r;})
            .attr("cx", function(d){return d.x;})
            .attr("cy", function(d){return d.y;});
        
        function updateAnimate(){
            dataset[0].x += (speed*(Math.random()-0.5))%width;
            dataset[0].y += (speed*(Math.random()-0.5))%height;
            console.log(dataset);

            svg.selectAll('circle').remove();
            svg.selectAll('circle')
                .data(dataset)
                .enter().append("circle")
                .style("stroke", "green")
                .style("fill", "green")
                .attr("r", function(d){return d.r;})
                .attr("cx", function(d){return d.y;})
                .attr("cy", function(d){return d.x;});
        }
        
        function paintStep(timestamp){
            if ($state.current.url === '/circle'){
                afID = window.requestAnimationFrame(paintStep);
                //console.log('repainting '+timestamp);
                frameCounts++;
                if (frameCounts > 0){
                    frameCounts = 0;
                    updateAnimate();
                }
            }
        }
        
        paintStep();
    }

    movingPlot();
})
.controller('GameCtrl', function($scope, $state) {
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

.controller('MyometerCtrl', function($scope, $state) {
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

.controller('HRVCtrl', function($scope, $state) {
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

.controller('PlotCtrl', function($scope, $state, Friends) {
    $scope.friends = Friends.all();
    
    var afID;
    
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

        var y = d3.scale.linear()
            .range([height, 0])
            .domain([-128, 127]);
    
        var yA = [];
        yA[0] = d3.scale.linear()
            .range([height, height/2])
            .domain([-128, 127]);
    
        yA[1] = d3.scale.linear()
            .range([height/2, 0])
            .domain([-128, 127]);
    
        var svg = d3.select('#plotWindow').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');    

        var line = d3.svg.line()
            .x(function(d,i) { return (startPos + i);})
            .y(function(d) { return y(d); });
    
        var lineA = [];
        lineA[0] = d3.svg.line()
            .x(function(d,i) { return (startPos + i);})
            .y(function(d) { return yA[0](d); });
    
        lineA[1] = d3.svg.line()
            .x(function(d,i) { return (startPos + i);})
            .y(function(d) { return yA[1](d); });
      
        data = [];
        data[0] = [];
        data[1] = [];
        for (var i = 0; i < 20; i++){
            data[0].push(256*(Math.random()-0.5));
            data[1].push(256*(Math.random()-0.5));
        }
        
        var color = ['red','blue'];
        console.log(color);
    
        for (var i = 0; i < 2; i++){
            svg.append('svg:path')
                .attr('class','line')
                .attr('stroke', color[i])
                .attr('d', lineA[i](data[i]));
        }
        
        function updateAnimate(){
//            var data = [0,1];
//            for (var i = 0; i < width; i++){
//                data.push(256*(Math.random()-0.5));
//            }
            data[0] = [];
            data[1] = [];
            startPos = xPos;
            for (var i = 0; i < 20; i++){
                //data.shift();
                data[0].push(256*(Math.random()-0.5));
                data[1].push(256*(Math.random()-0.5));
                xPos++;
                if (xPos >= width){
                    console.log('clearing');
                    data[0] = [];
                    data[1] = [];
                    xPos = 0;
                    startPos = xPos;
                    svg.selectAll('path.line').remove();
                        //.data([data])
//                        .attr('class','line')
//                        .attr('d', line(data));
                }
            }
            
            
            
            for (var i = 0; i < 2; i++){
                svg.append('svg:path')
                    .attr('class','line')
                    .attr('stroke', color[i])
                    .attr('d', lineA[i](data[i]));
            }
//            svg.selectAll('path')
//                .data([data])
//                .attr('class','line')
//                .attr('d', line);
            
            
//            xPos += data.length;
//            if (xPos >= width){xPos=0;}
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

.controller('TraceCtrl', function($scope, $state, flexvolt) {
    var afID;
    
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
    
        var svg = d3.select('#gamePlotWindow').append('svg')
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
            
            if (dataIn[0].length === 0){return;}
            //console.log('got data');
            //console.log(dataIn);
            if (dataIn === null){return;}
            
            data[0] = dataIn[0];
            data[1] = dataIn[1];
            startPos = xPos;
            for (var i = 0; i < dataIn.length; i++){
                data[i] = dataIn[i];
            }
            
            xPos += data[0].length;
            if (xPos >= width){
                console.log('clearing');
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
});
