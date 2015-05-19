/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 * 
 * task factories
 * 
 */
(function () {
'use strict';

angular.module('flexvolt.taskLogic', [])

/**
 * Abstracts the flexvolt, deals with bluetooth communications, etc.
 */
.factory('xyLogic', ['flexvolt', 'storage', 'xyDot', function(flexvolt, storage, xyDot) {
        
    var settings = {
        bounds : {
            min: 0,
            max: 255
        },
        thresh : {
            yH : '220',
            yL : '10',
            xH : '250',
            xL : '75'
        },
        plot : {
            thresh : true
        },
        fakeData : {
            useRandom: true,
            x: 128,
            y: 128
        }
    };
    
    var tmp = storage.get('xySettings');
    if (tmp){
        for (var field in tmp){
            settings[field] = tmp[field];
        }
    } else {
        console.log('DEBUG: no settings found for GoDot, using defaults');
    }
    
    var x = 128, y = 128;
    
    function rms(arr){
        var ret = 0;
        for (var i = 0; i < arr.length; i++){
            ret += Math.pow((arr[i]-127.5),2);
        }
        ret = 2*Math.sqrt(ret/arr.length);
        return ret;
    }
    
    function updateAnimate(demo){
        //console.log('updating, demo:'+$stateParams.demo);
        //console.log('updating, threshmode:'+settings.plot.mode);
        var speed = 4;
        if (demo) {
            if (settings.fakeData.useRandom) {
                x = Math.min(Math.max(x+speed*(Math.random()-0.5),0),256);
                y = Math.min(Math.max(y+speed*(Math.random()-0.5),0),256);
                xyDot.update(x,y);
                return;
            } else {
                var dataIn = [];
                // have to trick the rms calculator into returning the numbers selected!
                dataIn[0] = [parseInt(settings.fakeData.x)/2+127.5];
                dataIn[1] = [parseInt(settings.fakeData.y)/2+127.5];
            }
        } else {
            //if (!flexvolt.api.isConnected){return;}  BROKEN?!
            var dataIn = flexvolt.api.getDataParsed();
            if (dataIn === null || dataIn === angular.undefined || dataIn[0] === angular.undefined){return;}

            var n = dataIn[0].length;
            if (n <= 0){return;}
        }

//            if (settings.mode.selected === 'Track raw data'){
//                x = dataIn[0][n-1];
//                y = dataIn[1][n-1];
//            } else 
        if (settings.plot.thresh){
            //console.log('thresh');
            //calculate RMS, then apply thresholds for motion
            var xtmp = rms(dataIn[0]);
            var ytmp = rms(dataIn[1]);
            //console.log(dataIn[0]);
            if (xtmp > settings.thresh.xH){
                x += speed;
            } else if (xtmp < settings.thresh.xL){
                x -= speed;
            }

            
            if (ytmp > settings.thresh.yH){
                y += speed;
            } else if (ytmp < settings.thresh.yL){
                y -= speed;
            }
            
            //console.log('x: '+xtmp+', y: '+ytmp);

            if (x > 255){x=255;}
            if (x < 0){ x=0;}
            if (y > 255){y=255;}
            if (y < 0){ y=0;}
        } else {
            //console.log('rms');
            // just track RMS
            x = rms(dataIn[0]);
            y = rms(dataIn[1]);
        }
        //console.log('x:'+x+', y:'+y);
        xyDot.update(x,y);
    }

    function updateSettings(){
        storage.set({xySettings:settings});
    }

    return {
        settings: settings,
        updateSettings: updateSettings,
        updateAnimate: updateAnimate
    };
}])
.factory('traceLogic', ['storage', function(storage) {
    
    var channelList = [
        {text: '1', value: 1},
        {text: '2', value: 2},
        {text: '4', value: 4},
        {text: '8', value: 8}
    ];
    
    var filterTypes = [
        {text: 'none', value: 'NONE'},
        {text: 'LowPass',  value: 'LOW_PASS'},
        {text: 'HighPass', value: 'HIGH_PASS'},
        {text: 'BandPass', value: 'BAND_PASS'}
    ];
    
    var gainList = [
        {text: '0.5', value: 0.5},
        {text: '1', value: 1},
        {text: '1.5', value: 1.5},
        {text: '2', value: 2},
        {text: '5', value: 5}
    ];

    var settings = {
        nChannels: 2,
        fsFilter:{
            filterType: 'NONE',
            fs: 500,
            f1: 0,
            f2: 100,
            atten: 60,
            trband: 5
        },
        gain: 1
    };
    
    var tmp = storage.get('traceSettings');
    if (tmp){
        for (var field in tmp){
            console.log('getting field '+field);
            settings[field] = tmp[field];
        }
        console.log('settings: '+JSON.stringify(settings));
    } else {
        console.log('DEBUG: no settings found for trace, using defaults');
    }

    function updateSettings(){
        storage.set({traceSettings:settings});
    }
    
    return {
        channelList: channelList,
        filterTypes: filterTypes,
        gainList: gainList,
        settings: settings,
        updateSettings: updateSettings
    };
}])
.factory('rmsTimeLogic', ['storage', function(storage) {
    
    var channelList = [
        {text: "1", value: 1},
        {text: "2", value: 2},
        {text: "4", value: 4},
        {text: "8", value: 8}
    ];
    
    var zoomList = [
        {text: "x/y", value: 0},
        {text: "x only", value: 1},
        {text: "y only", value: 2}
    ];
    
    var filterTypes = [
        {text: 'none', value: 'NONE'},
        {text: 'LowPass',  value: 'LOW_PASS'},
        {text: 'HighPass', value: 'HIGH_PASS'},
        {text: 'BandPass', value: 'BAND_PASS'}
    ];

    var settings = {
        nChannels: 1,
        windowSize: 10,
        zoomOption: 0,
        fsFilter:{
            filterType: 'NONE',
            fs: 500,
            f1: 0,
            f2: 100,
            atten: 60,
            trband: 5
        }
    };
    
    var tmp = storage.get('rmsTimeSettings');
    if (tmp){
        for (var field in tmp){
            settings[field] = tmp[field];
        }
    } else {
        console.log('DEBUG: no settings found for RMS, using defaults');
    }

    function updateSettings(){
        storage.set({rmsTimeSettings:settings});
    }
    
    return {
        channelList: channelList,
        settings: settings,
        filterTypes: filterTypes,
        zoomList: zoomList,
        updateSettings: updateSettings
    };
}])
.factory('snakeLogic', function() {
    
    
})
.factory('ekgLogic', function() {
    
    
})
.factory('hrvLogic', function() {
    
    
})
;

}());
