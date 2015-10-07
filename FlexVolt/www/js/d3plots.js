/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 * 
 * factory for drawing the xyDot and trace plots
 * 
 */
(function () {
'use strict';

angular.module('flexvolt.d3plots', [])

/**
 * Abstracts the flexvolt, deals with bluetooth communications, etc.
 */
.factory('xyDot', function() {
    var mar, margin, width, height, plotElement;
    mar = 10;
    margin = {top: mar, right: mar, bottom: mar, left: mar};
    
    var xValue, xScale, xMap, yValue, yScale, yMap;
    var tail = true;
    var dataset = [];
    var nDots = 6;

    var svg;

    var api = {
        init:undefined,
        update:undefined,
        resize:undefined,
        size:{
            width:undefined,
            height:undefined
        },
        dotRadius:undefined,
        settings:{
            s1:1,
            s2:2
        }
    };
    
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - 150 - margin.top - margin.bottom;
    api.dotRadius = 15;
    
    function reset(){
        xValue = function(d) { return d.x;},
        xScale = d3.scale.linear()
            .range([api.dotRadius, width-api.dotRadius])
            .domain([0, 255]),
        xMap = function(d) {return xScale(xValue(d));};
        yValue = function(d) { return d.y;},
        yScale = d3.scale.linear()
            .range([height-api.dotRadius, api.dotRadius])
            .domain([0, 255]),
        yMap = function(d) {return yScale(yValue(d));};
    }

    function init(element){
        plotElement = element;
        svg = d3.select(element).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      
        if (!!tail){
          for (var i=0; i<nDots;i++){
            dataset[i]={
              x:width/2,
              y:height/2,
              r:api.dotRadius,
              c:'#1f77b4',
              o:(1.0-i/nDots)
            };
          }
        } else {
          dataset[0]={
            x:width/2,
            y:height/28,
            r:api.dotRadius,
            c:'#1f77b4',
            o:1.0
          };
        }
        
        reset();
      
//        svg.selectAll('circle')
//            .data(dataset)
//            .enter().append("circle")
//            .style("stroke", "gray")
//            .style("fill", function(d){return d.c;})
//            .style('opacity', function(d){return d.o;})
//            .attr("r", function(d){return d.r;})
//            .attr("cx", xMap)
//            .attr("cy", yMap);
        
    }
    
    function update(xIn, yIn){
        if(!!tail){
          for (var i=nDots-1; i>0; i--){
                dataset[i].x = dataset[i-1].x;
                dataset[i].y = dataset[i-1].y;
            }
            dataset[0].x = xIn;
            dataset[0].y = yIn;
        } else {
          dataset[0].x = xIn;
          dataset[0].y = yIn;
        }
        
        svg.selectAll('circle').remove();
        svg.selectAll('circle')
            .data(dataset)
            .enter().append("circle")
            .style('stroke', function(d){return d.c;})
            .style('fill', function(d){return d.c;})
            .style('opacity', function(d){return d.o;})
            .attr('r', function(d){return d.r;})
            .attr('cx', xMap)
            .attr('cy', yMap);
    }
    
    api.resize = function(){
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - 50 - margin.top - margin.bottom;
        d3.select('svg').remove();
        svg = d3.select(plotElement).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      
        if (!!tail){
          for (var i=0; i<nDots;i++){
            dataset[i]={
              x:width/2,
              y:height/2,
              r:15,
              c:'#1f77b4',
              o:(1.0-i/nDots)
            };
          }
        } else {
          dataset[0]={
            x:width/2,
            y:height/2,
            r:15,
            c:'#1f77b4',
            o:1.0
          };
        }
        
        reset();
    };

    api.init = init;
    api.update = update;
    api.size.width = width;
    api.size.height = height;

    return api;
})
.factory('tracePlot', function() {
    var colorList = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    var mar, margin, width, height, plotElement;
    mar = 10;
    var headerPadding = 44;
    var footerPadding = 68;
    margin = {top: mar, right: mar, bottom: mar, left: mar};
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding;
    var yMax = 128;
    var tmpData = [];
    var xPos = 0, startPos = 0;
        
    var svg, yA, lineA;

    var api = {
      init:undefined,
      reset:undefined,
      resize:undefined,
      update:undefined,
      setN:undefined,
      settings:{
        nChannels: 2  
      }
    };

    function setN(newN) {
      api.settings.nChannels = newN;
    }
    
    function reset(){
        svg.selectAll('path.line').remove();
        xPos = 0;
        startPos = 0;
        yA = [];
        tmpData = [];
        for (var i = 0; i < api.settings.nChannels; i++){
            tmpData[i] = undefined;
            yA[i] = d3.scale.linear()
                .range([height-i*(height/api.settings.nChannels), height-(i+1)*(height/api.settings.nChannels)])
                .domain([-yMax, +yMax]);
        }  

        lineA = [];
        if (api.settings.nChannels > 0){
            lineA[0] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[0](d); });
        }
        if (api.settings.nChannels > 1){
            lineA[1] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[1](d); });
        }
        if (api.settings.nChannels > 2){
            lineA[2] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[2](d); });
        }
        if (api.settings.nChannels > 3){
            lineA[3] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[3](d); });
        }
        if (api.settings.nChannels > 4){
            lineA[4] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[4](d); });
        }
        if (api.settings.nChannels > 5){
            lineA[5] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[5](d); });
        }
        if (api.settings.nChannels > 6){
            lineA[6] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[6](d); });
        }
        if (api.settings.nChannels > 7){
            lineA[7] = d3.svg.line()
                .x(function(d,i) { return (startPos + i);})
                .y(function(d) { return yA[7](d); });
        }
    }

    function init(element, nChannels){
        plotElement = element;
        yA = [];
        lineA = [];
        svg = undefined;
        api.settings.nChannels = nChannels;

        d3.select('svg').remove();
        svg = d3.select(element).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
          
        reset();
    }
    
    function update(dataIn){
        //console.log(angular.toJson(dataIn));
        startPos = xPos > 0?xPos-1:0;
        xPos += dataIn[0].length;
        if (xPos >= width){
            xPos = xPos%width;
            startPos = 0;
            for (var ind in dataIn){
                dataIn[ind].splice(0,dataIn[ind].length-xPos); // over ran width, splice out data up to width  
            }
            tmpData = [];
            for (var i = 0; i < api.settings.nChannels;i++){
                tmpData[i] = undefined;
            }
            svg.selectAll('path.line').remove();
        }

        for (var i = 0; i < api.settings.nChannels; i++){
            if (tmpData[i]) {dataIn[i].splice(0,0,tmpData[i]);}
            svg.append('svg:path')
                .attr('class','line')
                .attr('stroke', colorList[i])
                .attr('d', lineA[i](dataIn[i]));
            tmpData[i] = dataIn[i].slice(-1)[0];
        }
    }
    
    api.resize = function(){
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.top - headerPadding - margin.bottom - footerPadding
        yA = [];
        lineA = [];
        d3.select('svg').remove();
        svg = d3.select(plotElement).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')'); 
          
        reset();
    };
    
    api.init = init;
    api.update = update;
    api.reset = reset;
    api.setN = setN;
    
    return api;
})

.factory('rmsTimePlot', function() {
    var colorList = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    var margin, width, height, plotElement, dT;
    margin = {top: 30, right: 10, bottom: 40, left: 60};
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - 120 - margin.top - margin.bottom;
    
    var svg, x, y, autoY, xAxis, yAxis, zoom, line;
    var data = [], xPos = 0, startPos = 0;
    var tmpData = [];
    
    var GAIN = 1845;
    var xMax = 20;
    var yMax = 1000*2.5/GAIN; //mV // 130
    var factor = 1000*2.5/(GAIN*128);
    
    var panExtent = {x: [0,width], y: [-yMax,yMax] };

    var api = {
      init:undefined,
      reset:undefined,
      resize:undefined,
      update:undefined,
      settings:{
        nChannels: 1,
        zoomOption: 0,
        autoscaleY: false
      }
    };
    
    var oldPan = [0,0], oldScaleX = 1, oldScaleY = 1;
    
    function zoomed() {
//        var panX = 0, panY = 0, scaleCalc = 0;
//        var lastScale = d3.event.scale;
        var zoomOption = api.settings.zoomOption;
//        console.log('zoomOption:'+zoomOption);
//        
//        if (zoomOption === "NONE"){
//            console.log('none');
//            return;
//        }

        var panL = [0, 0];
	var scaleX = 1;
	var scaleY = 1;
        panL = panLimit();
        zoom.translate(panL);
        zoom.scale(d3.event.scale);
        //console.log('oldpan: '+angular.toJson(oldPan)+', oldScaleX: '+oldScaleX+', oldScaleY: '+oldScaleY);
        //console.log('pan: '+angular.toJson(panL)+', scale: '+d3.event.scale);
        scaleX = 1; scaleY = 1;
        
        if (zoomOption === 'NONE'){
            x = d3.scale.linear().domain([0, width]).range([0, width]);
            y = d3.scale.linear().range([height, 0]);
            if (api.settings.autoscaleY){
                y.domain([0, autoY()]);
            }else {
                y.domain([-yMax, yMax]);
            }
            return;
        } 
        if (zoomOption === 'X ONLY') {
            scaleX = d3.event.scale;
            y = d3.scale.linear().range([height, 0]);
            if (api.settings.autoscaleY){
                y.domain([0, autoY()]);
            }else {
                y.domain([-yMax, yMax]);
            }
            svg.select(".x.axis").call(xAxis);
        }  else if (!api.settings.autoscaleY){
            if (zoomOption === 'Y ONLY'){
                scaleY = d3.event.scale;
                x = d3.scale.linear().domain([0, width]).range([0, width]);
                svg.select(".y.axis").call(yAxis);
            } else if (zoomOption === 'X AND Y') {
                scaleX = d3.event.scale;
                scaleY = d3.event.scale;
                svg.select(".x.axis").call(xAxis);
                svg.select(".y.axis").call(yAxis);
            }
        }
        
        // having trouble getting the adjustment of previously drawn lines to work.
        // instead, just remove and redraw below
        //scaleX = scaleX / oldScaleX;
        //scaleY = scaleY / oldScaleY;
//        svg.selectAll("path.line") .attr("transform","translate("+panL+")scale("+scaleX+","+scaleY+")");
//        oldPan = panL;
//        oldScaleX = scaleX;
//        oldScaleY = scaleY;
//	if (!api.settings.autoscaleY && (zoomOption === 'X AND Y'|| zoomOption === 'Y ONLY') ){
//            svg.select(".y.axis").call(yAxis);
//        }
        
        svg.selectAll('path.line').remove();
        startPos = 0;
        xPos = data[0].length;
        for (var i = 0; i < api.settings.nChannels; i++){
            svg.append('svg:path')
                .datum(data[i])
                .attr('class', 'line')
                .attr('clip-path', 'url(#clip)')
                .attr('stroke', function(d,i){ 			
                        return colorList[i%colorList.length];
                })
                .attr('d', line);
                //.attr('d', line(dataIn[i]));
        }
	
//	svg.selectAll('path.line').attr('d', line);  
    }
    
    function panLimit() {

	var divisor = {h: height / ((y.domain()[1]-y.domain()[0])*zoom.scale()), w: width / ((x.domain()[1]-x.domain()[0])*zoom.scale())},
		minX = -(((x.domain()[0]-x.domain()[1])*zoom.scale())+(panExtent.x[1]-(panExtent.x[1]-(width/divisor.w)))),
		minY = -(((y.domain()[0]-y.domain()[1])*zoom.scale())+(panExtent.y[1]-(panExtent.y[1]-(height*(zoom.scale())/divisor.h))))*divisor.h,
		maxX = -(((x.domain()[0]-x.domain()[1]))+(panExtent.x[1]-panExtent.x[0]))*divisor.w*zoom.scale(),
		maxY = (((y.domain()[0]-y.domain()[1])*zoom.scale())+(panExtent.y[1]-panExtent.y[0]))*divisor.h*zoom.scale(); 

        var zoomOption = api.settings.zoomOption;
        var tx = 0, ty = 0;
        if (zoomOption === 'X AND Y'|| zoomOption === 'X ONLY'){
            //console.log('zoom x');
            tx = x.domain()[0] < panExtent.x[0] ? 
                        minX : 
                        x.domain()[1] > panExtent.x[1] ? 
                                maxX : 
                                zoom.translate()[0];
        }
        if (!api.settings.autoscaleY && (zoomOption === 'X AND Y'|| zoomOption === 'Y ONLY') ){
            //console.log('zoom y');
            ty = y.domain()[0]  < panExtent.y[0]? 
                        minY : 
                        y.domain()[1] > panExtent.y[1] ? 
                                maxY : 
                                zoom.translate()[1];
        }
	//console.log('panX: '+tx+', panY: '+ty);
	return [tx,ty];

    }
    
    autoY = function(){
        var tmp = [], allData = [];
        // combine all channels
        for (var chInd in data){
            allData = allData.concat(data[chInd]);
        }
        // combine all 'y' values
        for (var dInd in allData){
            tmp.push(allData[dInd].y);
        }
        // find the max
        var maxArr = Math.max.apply(Math, tmp);
        var ret = maxArr > 1? maxArr:1;
        ret *= factor;
        return ret; 
    };
    
    function reset(){
        
        if (svg){
            svg.selectAll('path.line').remove();
            d3.select('svg').remove();
        }
        
        xPos = 0;
        startPos = 0;
        data = [];
        tmpData = [];
        for (var i = 0; i < api.settings.nChannels;i++){
            data[i] = [];
            tmpData[i] = angular.undefined;
        }
        
        x = d3.scale.linear()
            .domain([0, width])
            .range([0, width]);
        
        y = d3.scale.linear().range([height, 0]);
        if (api.settings.autoscaleY){
            y.domain([0, autoY()]);
        }else {
            y.domain([-yMax, yMax]);
        }
    
        zoom = d3.behavior.zoom()
            .x(x)
            .y(y)
            .scaleExtent([1, 10])
            .on('zoom', zoomed);
    
        svg = d3.select(plotElement).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .call(zoom);
      
        line = d3.svg.line()
            .interpolate('linear')	
            .x(function(d, i) { return x(startPos + i); })
            .y(function(d, i) { return y(factor*d); });	
    
        xAxis = d3.svg.axis()
            .scale(x)
            .tickSize(-height)
            .tickPadding(10)	
            .tickSubdivide(true)	
            .orient('bottom');	

        yAxis = d3.svg.axis()
            .scale(y)
            .tickPadding(10)
            .tickSize(-width)
            .tickSubdivide(true)	
            .orient('left');
    
        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        svg.append('g')
            .attr('class', 'y axis')
            .append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', (-margin.left) + 15)
            .attr('x', -height/2-50)
            .text('RMS Muscle Signal (mV)');	
    
        svg.append('g')
            .attr('class', 'x axis')
            .append('text')
            .attr('class', 'axis-label')
            .attr('y', height+35)
            .attr('x', width/2)
            .text('Time (s)');	

        // keeps the zoom frame inside the plot window!
        svg.append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', width)
            .attr('height', height);

    }

    function init(element, nChannels, newZoomOption, userFrequency){
        dT = 1/userFrequency;
        xPos = 0;
        startPos = 0;
        plotElement = element;

        api.settings.zoomOption = newZoomOption;
        api.settings.nChannels = nChannels;
        
        reset();
    }
    
    function update(dataIn){
        startPos = xPos > 0?xPos-1:0;
        xPos += dataIn[0].length;
        if (xPos >= width){
            xPos = xPos%width;
            startPos = 0;
            for (var ind in dataIn){
                dataIn[ind].splice(0,dataIn[ind].length-xPos); // over ran width, splice out data up to width  
            }
            svg.selectAll('path.line').remove();
            data = [];
            for (var i = 0; i < api.settings.nChannels;i++){
                data[i] = [];
                tmpData[i] = angular.undefined;
            }
        }
      
        if (api.settings.autoscaleY){
            y.domain([0, autoY()]);
        }

        for (var i = 0; i < api.settings.nChannels; i++){
            data[i] = data[i].concat(dataIn[i]);
            if (tmpData[i]) {dataIn[i].splice(0,0,tmpData[i]);}
            
            svg.append('svg:path')
                .datum(dataIn[i])
                .attr('class', 'line')
                .attr('clip-path', 'url(#clip)')
                .attr('stroke', function(d,i){ 			
                        return colorList[i%colorList.length];
                })
                .attr('d', line);

            tmpData[i] = dataIn[i].slice(-1)[0];
        }
    }
    
    // different than the rest because it's a different structure
//    function update(dataIn){
//        for (var i = 0; i < api.settings.nChannels; i++){
//            var dataSet = dataIn[i];
//            if (dataSet !== angular.undefined){
//                subUpdate(dataIn);
//            }
//        }
//    }
//    
//    function subUpdate(dataIn){
////        console.log('t:'+JSON.stringify(timePos)+', n:'+JSON.stringify(nPoints));
//        xPos += dataIn.length*dT;
//        
//        if (xPos >= xMax){
//            //console.log('clearing');
//            data = [];
//            for (var i = 0; i < api.settings.nChannels;i++){
//                data[i] = [];
//            }
//            
//            xPos = 0;
//            svg.selectAll('path.line').remove();
//            return;
//        } else {
//            for (var i = 0; i < api.settings.nChannels;i++){
//                //data[i].push({x:timePos,y:rms(dataIn[i])});
//                data[i].push({x:timePos,y:dataIn[i]});
//            }
//            
//            if (api.settings.autoscaleY){
//                y.domain([0, autoY()]);
//            }
////            console.log(data);
//            //console.log(data);
//            svg.selectAll('path.line').remove();
//            svg.selectAll('.line')
//                .data(data)
//                .enter()
//                .append('path')
//                .attr('class', 'line')
//                .attr('clip-path', 'url(#clip)')
//                .attr('stroke', function(d,i){ 			
//                        return colorList[i%colorList.length];
//                })
//                .attr('d', line);
//        } 
//    }
    
    api.resize = function(){
        console.log('DEBUG: plot resized');
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - 120 - margin.top - margin.bottom;

        d3.select('svg').remove();
        svg = d3.select(plotElement).append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')'); 
          
        reset();
    };
    
    api.init = init;
    api.update = update;
    api.reset = reset;
    
    return api;
})
;

}());
