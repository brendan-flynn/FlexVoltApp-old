/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 * 
 * main services factory for app
 * 
 */

(function () {
'use strict';

angular.module('flexvolt.services', [])

.factory('bluetoothPlugin', ['$timeout', function($timeout){
    
    var bluetoothPlugin = {
        isConnected: undefined,
        connect: undefined,
        connectionId: undefined,
        disconnect: undefined,
        clear: undefined,
        list: undefined,
        write: undefined,
        subscribe: undefined
    };
    
    ionic.Platform.ready(function() {
        window.device = ionic.Platform.device();
        window.platform = ionic.Platform.platform();
        //console.log('INFO: ionic ready, platform: '+window.platform);
        if (window.cordova) {
            window.flexvoltPlatform = 'cordova';
            console.log('INFO: ionic ready, using cordova, platform: '+window.platform);
            bluetoothPlugin.connect = bluetoothSerial.connect;
            bluetoothPlugin.disconnect = bluetoothSerial.disconnect;
            bluetoothPlugin.clear = bluetoothSerial.clear;
            bluetoothPlugin.list = bluetoothSerial.list;
            bluetoothPlugin.subscribe = bluetoothSerial.subscribeRawData;
            bluetoothPlugin.write = bluetoothSerial.write;
            bluetoothPlugin.isConnected = function(connectedCB, notConnectedCB, errFunc){
                try{ 
                    bluetoothSerial.isconnected(connectedCB, notConnectedCB);
                } catch(err) {errFunc(err);}
            };
        } else {
            // For chrome.serial, include wrappers to handle different args.  
            // bluetoothSerial is the template for args
            window.flexvoltPlatform = 'chrome';
            console.log('INFO: ionic ready, using chrome, platform: '+window.platform);
            //console.log(chrome.serial);
            bluetoothPlugin.isConnected = function(connectedCB, notConnectedCB, errFunc){
                console.log('DEBUG: bluetoothPlugin.isConnected');
                try {
                    chrome.serial.getInfo(bluetoothPlugin.connectionId, function(info){
                        if (info === angular.undefined){
                            //console.log('No connection info found.');
                            notConnectedCB();
                        } else {
                            //console.log('Still connected with info:');
                            //console.log(info);
                            connectedCB();
                        }
                    });
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.connect = function(portName, callback, errFunc){
                console.log('DEBUG: bluetoothPlugin.connect');
                try {
                    //console.log('Chrome connecting to '+portName);
                    // was having issues with windows 8 not disconnecting quickly enough
                    // so far the solution has been a 50ms $timeout in felxvolt.js between
                    // searching disconnect and connecting connect.
                    // The complex inner guts below may no longer be necessary
                    chrome.serial.connect(portName,{bitrate: 230400, ctsFlowControl: true},function(info){
                        if (chrome.runtime.lastError) {
                            console.log('ERROR: Chrome runtime error during Serial.connect: '+chrome.runtime.lastError.message);
                        }
                        if (info === angular.undefined){
                            console.log('DEBUG: Connection info empty');
                            //errFunc('Connection Unsuccessful.')
                            $timeout(function(){
                                //console.log('Clearing/Disconnecting');
                                bluetoothPlugin.disconnect(function(){
                                    if (chrome.runtime.lastError) {
                                        console.log('ERROR: Chrome runtime error during Serial.disconnect: '+chrome.runtime.lastError.message);
                                    }
                                    console.log('Disconnected, portNamt:'+portName);
                                    chrome.serial.connect(portName,{bitrate: 230400, ctsFlowControl: true},function(info){
                                        if (chrome.runtime.lastError) {
                                            console.log('ERROR: Chrome runtime error during Serial.connect: '+chrome.runtime.lastError.message);
                                        }
                                        console.log('DEBUG: Chrome connecting to '+portName+' 2nd time');
                                        if (info === angular.undefined){
                                            errFunc('Connection info was empty 2nd time');
                                            return;
                                        } else {
                                            //console.log('connected with info:');
                                            console.log(info);
                                            // save the Id for future write calls
                                            bluetoothPlugin.connectionId = info.connectionId;
                                            callback();
                                        }
                                    });
                                },errFunc);
                            },50);
                        } else {
                            //console.log('connected with info:');
                            console.log(info);
                            // save the Id for future write calls
                            bluetoothPlugin.connectionId = info.connectionId;
                            callback();
                        }
                    });
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.disconnect = function(callback,errFunc){
                console.log('DEBUG: bluetoothPlugin.disconnect');
                try {
                    // find and disconnect all existing connections
                    //console.log('In disconnect, connectionId: '+bluetoothPlugin.connectionId);
                    chrome.serial.getConnections( function(connectionInfos){
                        connectionInfos.forEach(function(con){
                            console.log('Disconnecting connectionId '+con.connectionId);
                            chrome.serial.disconnect(con.connectionId, function(){
                                //console.log('disconnecting');
                            });
                        });
                        bluetoothPlugin.connectionId = undefined;
                        callback();
                    });
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.clear = function(callback,errFunc){
                console.log('DEBUG: bluetoothPlugin.clear');
                try {
                    chrome.serial.flush(bluetoothPlugin.connectionId, callback);
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.list = function(callback,errFunc){
                console.log('DEBUG: bluetoothPlugin.list');
                try {
                    chrome.serial.getDevices(callback);
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.subscribe = function(callback,errFunc){
                var onReceiveCallback = function(obj){
                    //console.log('received!');
                    var bytes = new Uint8Array(obj.data);
                    callback(bytes);
                };
                try {
                    //console.log('settings up events');
                    chrome.serial.onReceive.addListener(onReceiveCallback);
                    chrome.serial.onReceiveError.addListener(errFunc);
                } catch (err) {errFunc(err);}
            };
            bluetoothPlugin.write = function(data,callback,errFunc){
                if (bluetoothPlugin.connectionId === angular.undefined){
                    console.log('ERROR: Cannot write to port, connectionId undefined!');
                    return;
                } else if(bluetoothPlugin.connectionId<0){
                    console.log('ERROR: Cannot write to port, connectionId: '+bluetoothPlugin.connectionId);
                    return;
                }
                try {
                    if ( (typeof data) === 'string'){
                        //console.log('data to write, '+data+', was a string!');
                        var buf=new ArrayBuffer(data.length);
                        var bufView=new Uint8Array(buf);
                        for (var i=0; i<data.length; i++) {
                          bufView[i]=data.charCodeAt(i);
                        }
                        data = buf;
                    }
                    var onSent = function(sendInfo){
                        //console.log('sent '+sendInfo.bytesSent+' bytes with error: '+sendInfo.error);
                        callback();
                    };
                    //console.log('chrome.serial.writing:');
                    //console.log(data); // IT'S AN ARRAY BUFFER - CAN't LOG IT DIRECTLY
                    chrome.serial.send(bluetoothPlugin.connectionId, data, onSent);
                } catch(err) {errFunc(err);}
            };
        }
        
    });
    
    return bluetoothPlugin;
}])

//.factory('clipboard', function(){
//    
//    
//    var clipboard = {
//        copy: undefined,
//        paste: undefined
//    };
//    
//    ionic.Platform.ready(function() {
//        if (window.cordova && window.cordova.plugins !== angular.undefined && window.cordova.plugins.clipboard !== angular.undefined) {
//            //console.log('initializing clipboard');
//            //console.log(window.cordova.plugins);
//            clipboard.copy = window.cordova.plugins.clipboard.copy;
//            clipboard.paste = window.cordova.plugins.clipboard.paste;
//        } else {
//            clipboard.copy = function(){};
//            clipboard.paste = function(){};
//        }
//        
//    });
//    
//    return clipboard;
//})
.factory('storage', ['$window', function($window) {
    var storage = {
        set: undefined,
        get: undefined,
        dataStore: undefined
    };
        
    ionic.Platform.ready(function() {
        if (window.cordova) {
            // window.localStorage is synchronous, so we can load as needed
            storage.set = function(obj) {
                var key = Object.keys(obj)[0];
                var value = obj[key].valueOf();
                $window.localStorage[key] = JSON.stringify(value);
            };
            storage.get = function(key) {
                return JSON.parse($window.localStorage[key] || false);
            };
            //window.storage = storage;
        } else {
            // chrome storage is async, which is a pain, so load all now into a copy
            // then load from the copy as needed...
            
            storage.set = function(obj) {
                chrome.storage.local.set(obj);
                storage.load(); // just to keep them in sync
            };
            // pass in default object, overwrites key values if present in storage
            storage.get = function(key) {
                return storage.dataStore[key];
            };
            storage.load = function() {
                chrome.storage.local.get(null, function(item){
                    // only log this on initial load
                    if (storage.dataStore === angular.undefined){
                        storage.dataStore = item;
                        console.log('Loaded stored settings: '+JSON.stringify(storage.dataStore));
                    } else {
                        storage.dataStore = item;
                    }
                    
                });
            };
            
            storage.load();
            
            //window.storage = storage;
        }
    });
    
    return storage;
}])
;

}());