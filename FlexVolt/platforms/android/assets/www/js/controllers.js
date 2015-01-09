angular.module('flexvolt.controllers', [])

.controller('DashCtrl', function() {
    var plot = d3.select("#testDiv").append("svg:svg").attr("width", 200).attr("height", 200);
    var bar = plot.selectAll("rect").data([1,4,3,6,2,5]).enter().append("svg:rect");
    bar.attr("height",function(d) {return d*20;})
            .attr("width", 15)
            .attr("x",function(d,i){return i*30;})
            .attr("y",function(d) {return 100-20*d;})
            .attr("fill","steelblue");
    
    //var element = document.getElementById("slider");
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
    
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
          width = 600 - margin.left - margin.right,
          height = 200 - margin.top - margin.bottom;
    
    function movingPlot(){
        var xPos = 0;
        var data;
//        var x = d3.scale.linear()
//            .range([0, width])
//            .domain([0, width]);

        var y = d3.scale.linear()
            .range([height, 0])
            .domain([-128, 127]);
    
        var svg = d3.select("#plotWindow").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");    

        var line = d3.svg.line()
            .x(function(d,i) { return (xPos - data.length + i);})
            .y(function(d) { return y(d); });
    
        data = [];
        for (var i = 0; i < 20; i++){
            data.push(256*(Math.random()-0.5));
        }
    
        svg.append("svg:path")
                .attr("class","line")
                .attr("d", line(data));
        
        function updateAnimate(){
//            var data = [0,1];
//            for (var i = 0; i < width; i++){
//                data.push(256*(Math.random()-0.5));
//            }
            data = [];
            for (var i = 0; i < 20; i++){
                //data.shift();
                data.push(256*(Math.random()-0.5));
                xPos++;
                if (xPos >= width){
                    console.log('clearing');
                    data = [];
                    xPos = 0;
                    svg.selectAll("path.line").remove();
                        //.data([data])
//                        .attr("class","line")
//                        .attr("d", line(data));
                }
            }
            
            svg.append("svg:path")
                .attr("class","line")
                .attr("d", line(data));
//            svg.selectAll("path")
//                .data([data])
//                .attr("class","line")
//                .attr("d", line);
            
            
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

.controller('GameCtrl', function($scope, $state) {
  
  var afID;
    var currentUrl = $state.current.url;
    console.log('currentUrl = '+currentUrl);
//    $scope.$on('$ionicView.leave', function(){
//        var stateChangeListener = $scope.$on('$stateChangeSuccess', function(data){
//            if(data.url !== currentUrl){
//                console.log('switching states, afID = '+afID);
//                stateChangeListener();
//                if (afID !== null){
//                    window.cancelAnimationFrame(afID);
//                }
//            }
//        });
//    });
    
    function grabData(){
        if (!flexvolt.isConnected){return;}
        flexvolt.readAll();
    }

    function paintStep(timestamp){
        if ($state.current.url === '/settings'){
            afID = window.requestAnimationFrame(paintStep);
            //console.log('repaint id = '+afID);
            grabData();
        }
    }

    paintStep();
})

.controller('SettingsCtrl', function($scope, $state, flexvolt) {
    $scope.flexvolt = flexvolt;
    window.flexvolt = flexvolt;
    
    $scope.getData = function(){
        console.log('trying to get data');
        flexvolt.readAll();
    };
    
    $scope.poll = function(){
        console.log('trying to poll');
        flexvolt.pollVersion();
    }
});
