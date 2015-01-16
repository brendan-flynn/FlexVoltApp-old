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

angular.module('flexvolt.xyDot', [])

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
      xMap = function(d) {return xScale(xValue(d))};
      yValue = function(d) { return d.y;},
      yScale = d3.scale.linear()
        .range([0, height])
        .domain([0, 256]),
      yMap = function(d) {return yScale(yValue(d))};
      
      if (!!tail){
        for (var i=0; i<nDots;i++){
          dataset[i]={
            x:128,
            y:128,
            r:15,
            c:'#1f77b4',
            o:(1.0-i/nDots)
          }
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
        console.log('x:'+xIn+', y:'+yIn);
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

