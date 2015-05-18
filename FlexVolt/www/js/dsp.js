/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Author: Brendan Flynn
 * 
 * Stand-alone factory to handle all FlexVolt digital signal processing
 * 
 * 
 */

(function () {
'use strict';
    
angular.module('flexvolt.dsp', [])

.factory('dataHandler', ['flexvolt', 'rmsfilter', 'dftfilter', '$stateParams', 
    function (flexvolt, rmsfilter, dftfilter, $stateParams) {
        
        // list of possible filters
        var filterList = {
            rmsfilter: rmsfilter
        };
        
        var nChannels = 1, gain = 1; // default
        var filter, filterSettings, dftSettings, dftFlag = false;
        var metricsArr, metricsFlag = false, metricsNPoints = 500;
        var demoVals = {
            fs: 500,
            time: 0,
            startTime: undefined,
            randAmplitude: 10,
            amplitudes: [50, 50, 50, 50, 50, 50, 50, 50],
            frequencies: [5, 10, 15, 20, 30, 50, 70, 100]
        };
    
        var api = {
            init: undefined,
            setDftFilter: undefined,
            rmDftFilter: undefined,
            setFilter: undefined,
            rmFilter: undefined,
            setMetrics: undefined,
            rmMetrics: undefined,
            getData: undefined,
            getMetrics: undefined
        };

        // Demo simulation data
        function generateData(G) {
            var gen = [];
            var tmp = new Date();
            var tmpTime = tmp.getTime();
            var nPoints = Math.round(demoVals.fs*(tmpTime - demoVals.startTime)/1000);
            
            demoVals.startTime = tmpTime;
            
            for (var i = 0; i<nPoints; i++) {
                demoVals.time += 1/demoVals.fs;
                for (var ch = 0; ch < nChannels; ch++){
                    if (i === 0){
                        gen[ch] = [];
                    }
                    gen[ch][i] = G*demoVals.amplitudes[ch]*Math.sin(demoVals.time*2*Math.PI*demoVals.frequencies[ch]);
                    //gen[ch][i] += demoVals.randAmplitude*2*(Math.random()-0.5); // random noise
                }
            }
            return gen;
        }
        
        // Handles changes to settings in real time
        api.init = function(nChan, gain_){
            var tmp = new Date();
            demoVals.startTime = tmp.getTime();  // only needed for demo simulation
            demoVals.fs = flexvolt.api.settings.userFrequency;
            nChannels = nChan;  // have a default of 1
            gain = gain_;
            
            // clear all filters (otherwise filters get carried between pages!
            api.rmDftFilter();
            api.rmFilter();
//            if (filter){
//                filter.init(filterSettings);
//            }
//            if (dftFlag){
//                dftfilter.init(dftSettings);
//            }
        };
        
        //   DFT-FIR  Discrete fourier transform-based Finite impulse response filter
        api.setDftFilter = function(settings){
            if (settings.filterType !== 'NONE'){
                dftSettings = settings;
                dftfilter.init(dftSettings);
                dftFlag = true;
            }
        };
        
        api.rmDftFilter = function(){dftFlag = false;};
        
        
        //  Other user-selected/designed filters
        api.setFilter = function(filtertype, settings){
            filter = undefined;
            filter = filterList[filtertype];
            if (filter !== angular.undefined){
                filterSettings = settings;
                filter.init(filterSettings);
            } else {
                console.log('WARNING: dsp.setFilter called without a proper filter: '+filtertype+', '+JSON.stringify(settings));
            }
        };
        
        api.rmFilter = function(){filter = undefined;};
        
        // Set metrics buffering
        api.setMetrics = function(nDataPoints){
            metricsFlag = true;
            metricsArr = [];
            if (nDataPoints !== angular.undefined){
                metricsNPoints = nDataPoints; // default
            }
        };
        
        api.rmMetrics = function(){metricsFlag = false;};
        
        function addToMetrics(data){
            for (var ch in data){
                if (metricsArr[ch] !== angular.undefined){
                    metricsArr[ch] = metricsArr[ch].concat(data[ch]);
                } else {
                    metricsArr[ch] = data[ch];
                }
                metricsArr[ch].splice(0,metricsArr[ch].length-metricsNPoints);
            }
        }

        api.getData = function(){
            var parsedData;
            // Get Data (real or simulated)
            if ($stateParams.demo){
                // simulate data
                parsedData = generateData(gain); 
            } else {
                parsedData = flexvolt.api.getDataParsed(gain);
            }
            
            // Make this faster by only processing nChannels
            parsedData.splice(nChannels);
            
            // Frequency Filter if set
            if (dftFlag){
                parsedData = dftfilter.apply(parsedData);
            }
            
            // Calculate metrics if set (using DFT-filtered data array (NOT structurally changed RMS-filtered structure)
            if (metricsFlag) {
                addToMetrics(parsedData);
            }
            
            // Secondary Filter if set (rms, smooth, averaging, etc)
            if (filter !== angular.undefined){
                parsedData = filter.apply(parsedData);
            }
            
            
            
            
            return parsedData;
        };

        api.getMetrics = function(){
            var ret = [];
            for (var ch in metricsArr){
                ret[ch] = {
                    minAmplitude: undefined,
                    maxAmplitude: undefined,
                    meanAmplitude: undefined
                };
                var tmp = metricsArr[ch];
                //console.log(tmp);
                ret[ch].minAmplitude = Math.min.apply(Math,tmp);
                ret[ch].maxAmplitude = Math.max.apply(Math,tmp);
                var tmpSum = 0;
                for (var i = 0; i < tmp.length; i++){
                    tmpSum += tmp[i];
                }
                ret[ch].meanAmplitude = tmpSum/tmp.length;
            }
            return ret;
        };

        return api;
    }
])

/**
 * Root Mean Square filter
 */
.factory('rmsfilter', [ function() {

  var dataParsed, windowSize, windowSizeDefault = 10;

  // api... contains the API that will be exposed via the 'flexvolt' service.
  var api = {
      init: undefined,
      apply: undefined
  };

  api.init = function(settings){
      dataParsed = [];
      windowSize = (settings.windowSize !== angular.undefined)?settings.windowSize:windowSizeDefault; // default if not defined
      console.log('rmsWindowSize: '+windowSize);
  };

  function rms(arr){
      //var sumOfSquares = arr.reduce(function(sum,x){return (sum + (x)*(x));}, 0);
      var sumOfSquares = 0;
      for (var i = 0; i < arr.length; i++){
          sumOfSquares += Math.pow(arr[i],2);
      }
      return Math.sqrt(sumOfSquares/arr.length);
  };

  // dataIn is a parsed data object - with an array for each channel
  api.apply = function(dataIn){
      var dataObject = [], nReturned;

      for (var ch in dataIn){
          if (dataParsed[ch] !== angular.undefined){
              dataParsed[ch] = dataParsed[ch].concat(dataIn[ch]);
          } else {
              dataParsed[ch] = dataIn[ch];
          }
      }

      var dLength = undefined;
      if (dataParsed !== angular.undefined && dataParsed[0] !== angular.undefined){
          dLength = dataParsed[0].length;
      }

      if (windowSize === angular.undefined) {
          windowSize = dLength;
          nReturned = dLength;
      } else {nReturned = windowSize;}

      while (dataParsed[0] !== angular.undefined && dataParsed[0].length >= windowSize){
          var dataRMS = [];
          for (var ch in dataParsed){
              dataRMS[ch] = rms(dataParsed[ch].splice(0,windowSize));
          }
          dataObject.push({data:dataRMS,nSamples:nReturned});
      }

      return dataObject;
  };

  return api;
}])

/**
 * Root Mean Square filter
 */
.factory('dftfilter', [ function() {
    var dataParsed, bufferLen; // buffer
    var a, kaiserV;
    var f1, f2, fN, atten, trband, order, filterType;

    var LOW_PASS = 'LOW_PASS';
    var HIGH_PASS = 'HIGH_PASS';
    var BAND_PASS = 'BAND_PASS';
  
    function bessel(x) {
        // zero order Bessel function of the first kind
        var eps = 1.0e-6; // accuracy parameter
        var fact = 1.0;
        var x2 = 0.5 * x;
        var p = x2;
        var t = p * p;
        var s = 1.0 + t;
        for (var k = 2; t > eps; k++) {
            p *= x2;
            fact *= k;
            t = Math.pow((p / fact),2);
            s += t;
        }
        return s;
    }
    
    function computeOrder() {
        // estimate filter order
        order = 2 * Math.round((atten - 7.95) / (14.36*trband/fN) + 1.0);
        // estimate Kaiser window parameter
        if (atten >= 50.0) {kaiserV = 0.1102*(atten - 8.7);}
        else {
            if (atten > 21.0) {
                kaiserV = 0.5842*Math.exp(0.4*Math.log(atten - 21.0))+ 0.07886*(atten - 21.0);
            }
        }
        if (atten <= 21.0) {kaiserV = 0.0;}

    }
    
    function resetData(){
        dataParsed = [];
    }
  
  // api... contains the API that will be exposed via the 'flexvolt' service.
    var api = {
        init: undefined,
        apply: undefined
    };

    api.init = function(settings){
        console.log('DEBUG: setting dft filter: '+JSON.stringify(settings));
        filterType = settings.filterType;
        fN=settings.fs*0.5;
        f1=settings.f1;
        f2=settings.f2;
        atten=settings.atten;
        trband=settings.trband;
        
        computeOrder();
        bufferLen = order + Math.round(2*fN/30)+1; // set buffer to order + max number of samples expected per frame
        console.log('DEBUG: filter oder (# taps): '+order+', buffer length: '+bufferLen);
        resetData();
        
        // window function values
        var I0alpha = 1/bessel(kaiserV);
        var m = order>>1;
        var win = new Array(m+1);
        for (var n=1; n <= m; n++) {
            win[n] = bessel(kaiserV*Math.sqrt(1.0 - Math.pow((n/m),2))) * I0alpha;
        }

        var w0 = 0.0;
        var w1 = 0.0;
        switch (filterType) {
            case LOW_PASS:
                w0 = 0.0;
                w1 = Math.PI*(f2 + 0.5*trband)/fN;
                break;
            case HIGH_PASS:
                w0 = Math.PI;
                w1 = Math.PI*(1.0 - (f1 - 0.5*trband)/fN);
                break;
            case BAND_PASS:
                w0 = (Math.PI/2) * (f1 + f2) / fN;
                w1 = (Math.PI/2) * (f2 - f1 + trband) / fN;
                break;
        }

        // filter coefficients (NB not normalised to unit maximum gain)
        a = new Array(order+1);
        a[0] = w1 / Math.PI;
        for (var n=1; n <= m; n++) {
            a[n] = Math.sin(n*w1)*Math.cos(n*w0)*win[n]/(n*Math.PI);
        }
        // shift impulse response to make filter causal:
        for (var n=m+1; n<=order; n++) {a[n] = a[n - m];}
        for (var n=0; n<=m-1; n++) {a[n] = a[order - n];}
        a[m] = w1 / Math.PI;
    };

    // dataIn is a parsed data object - with an array for each channel
    api.apply = function(dataIn){
        var dataObject;
        
        for (var ch in dataIn){
            if (dataParsed[ch] !== angular.undefined){
                dataParsed[ch] = dataParsed[ch].concat(dataIn[ch]);
            } else {
                dataParsed[ch] = dataIn[ch];
            }
        }
             
        if (dataParsed[0] !== angular.undefined && dataParsed[0].length >= bufferLen){
            dataObject = [];
            for (var ch in dataIn){
                var newPoints = dataIn[ch].length;
                dataObject[ch] = fir(dataParsed[ch],newPoints);
                //console.log(dataParsed);
                dataParsed[ch].splice(0,newPoints); // remove old points
            }
        }

        return dataObject;
    };
    
    function fir(ip, nCalc){
        //console.log('ip.length:'+ip.length+', nCalc:'+nCalc);
        var op = new Array(nCalc);
        var sum;
        for (var i=ip.length-nCalc; i<ip.length; i++) {
          sum = 0.0;
          for (var k=0; k<order; k++) sum += ((i-k)<0)?0:a[k]*ip[i-k]; // ternary operator handles indexOutOfBounds
          op[i - (ip.length-nCalc)] = sum;
        }
        return op;
    }

  return api;
}])

;
  
  
  
}());
