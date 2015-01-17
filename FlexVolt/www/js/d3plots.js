/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 * 
 * factory for drawing the xyDot
 * 
 */

angular.module('flexvolt.d3plots', [])

/**
 * Abstracts the flexvolt, deals with bluetooth communications, etc.
 */
.factory('xyDot', function() {
  var mar = 10;
  var margin = {top: mar, right: mar, bottom: mar, left: mar},
        width = 400 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
  var xValue, xScale, xMap, yValue, yScale, yMap;
  var tail = true;
  var dataset = [];
  var nDots = 6;
        
  var svg;
    
  api = {
        init:undefined,
        update:undefined,
        settings:{
            s1:1,
            s2:2
        }
    };

    function init(element){
      svg = d3.select(element).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      
      xValue = function(d) { return d.x;},
      xScale = d3.scale.linear()
        .range([0, width])
        .domain([0, 256]),
      xMap = function(d) {return xScale(xValue(d));};
      yValue = function(d) { return d.y;},
      yScale = d3.scale.linear()
        .range([0, height])
        .domain([0, 256]),
      yMap = function(d) {return yScale(yValue(d));};
      
      if (!!tail){
        for (var i=0; i<nDots;i++){
          dataset[i]={
            x:128,
            y:128,
            r:15,
            c:'#1f77b4',
            o:(1.0-i/nDots)
          };
        }
      } else {
        dataset[0]={
          x:128,
          y:128,
          r:15,
          c:'#1f77b4',
          o:1.0
        };
      }
      
      svg.selectAll('circle')
        .data(dataset)
        .enter().append("circle")
        .style("stroke", "gray")
        .style("fill", function(d){return d.c;})
        .style('opacity', function(d){return d.o;})
        .attr("r", function(d){return d.r;})
        .attr("cx", xMap)
        .attr("cy", yMap);
        
    }
    
    function update(xIn, yIn){
        //console.log('x:'+xIn+', y:'+yIn);
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

    api.init = init;
    api.update = update;

    return api;
})
.factory('tracePlot', function() {
    var colorList = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
    
    var mar = 10;
    var margin = {top: mar, right: mar, bottom: mar, left: mar},
          width = 400 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;
    var xPos = 0, startPos = 0;
        
    var svg, yA, lineA;

    var api = {
      init:undefined,
      reset:undefined,
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
        for (var i = 0; i < api.settings.nChannels; i++){
            yA[i] = d3.scale.linear()
                .range([height-i*(height/api.settings.nChannels), height-(i+1)*(height/api.settings.nChannels)])
                .domain([-128, 127]);
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
        yA = [];
        lineA = [];
        svg = undefined;
        api.settings.nChannels = nChannels;
        svg = d3.select(element).append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')'); 
          
        reset();
    }
    
    function update(dataIn){
      startPos = xPos;
      xPos += dataIn[0].length;
      if (xPos >= width){
          //console.log('clearing');
          xPos = 0;
          startPos = xPos;
          svg.selectAll('path.line').remove();
      }

      for (var i = 0; i < api.settings.nChannels; i++){
          svg.append('svg:path')
              .attr('class','line')
              .attr('stroke', colorList[i])
              .attr('d', lineA[i](dataIn[i]));
      }
    }
    
    api.init = init;
    api.update = update;
    api.reset = reset;
    api.setN = setN;
    
    return api;
})
;

