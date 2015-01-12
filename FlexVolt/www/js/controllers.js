angular.module('flexvolt.controllers', [])

.controller('DashCtrl', function() {
    var plot = d3.select('#testDiv').append('svg:svg').attr('width', 200).attr('height', 200);
    var bar = plot.selectAll('rect').data([1,4,3,6,2,5]).enter().append('svg:rect');
    bar.attr('height',function(d) {return d*20;})
            .attr('width', 15)
            .attr('x',function(d,i){return i*30;})
            .attr('y',function(d) {return 100-20*d;})
            .attr('fill','steelblue');
    
    //var element = document.getElementById('slider');
    //var start = null;
    //var cbID = null;
    
//    function paintStep(timestamp){
//        window.requestAnimationFrame(paintStep);
//        //console.log('repainting '+timestamp);
//    }
//    
//    paintStep();
    
    //cbID = window.requestAnimationFrame(paintStep);
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
            .y(function(d) { return y1(d); });
    
        lineA[1] = d3.svg.line()
            .x(function(d,i) { return (startPos + i);})
            .y(function(d) { return y2(d); });
      
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

.controller('GameCtrl', function($scope, $state, flexvolt) {
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
            if ($state.current.url === '/game'){
                afID = window.requestAnimationFrame(paintStep);
                updateAnimate();
            }
        }
        
        paintStep();
    }

    movingPlot();
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
