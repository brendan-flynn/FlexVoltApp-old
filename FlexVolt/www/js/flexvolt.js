/* Original Author: Brendan Flynn & Rob Chambers!
 * 
 * Stand-alone factory to handle all FlexVolt communications
 * 
 * Provides methods (such as getData) which can be called regularly to get data
 * 
 * ex:  
 *      function updateAnimate(){
 *          var data = getData();
 *          do animation stuff with the new data
 *      }
 * 
 *      function animateStep(){
 *          afID = window.requestAnimationFrame(paintStep);
 *          updateAnimate();
 *      }
 *      
 *      animateStep();
 * 
 * The above example calls getData evert frame (typically 60 FPS)
 * 
 */

(function () {
'use strict';
    
angular.module('flexvolt.flexvolt', [])

/**
 * Abstracts the flexvolt, deals with bluetooth communications, etc.
 */
  .factory('flexvolt', ['$timeout', '$interval', 'bluetoothPlugin', function($timeout, $interval, bluetoothPlugin) {
    var connectionTestInterval;
    var receivedData;
    var defaultWait = 500;
    var modelList = [];
    var dots = '';
    modelList[0] = 'USB 2 Channel';
    modelList[1] = 'USB 4 Channel';
    modelList[2] = 'USB 8 Channel';
    modelList[3] = 'Bluetooth 2 Channel';
    modelList[4] = 'Bluetooth 4 Channel';
    modelList[5] = 'Bluetooth 8 Channel';
    
    // api... contains the API that will be exposed via the 'flexvolt' service.
    var api = {
        disconnect: undefined,
        updatePorts: undefined,
        turnDataOn: undefined,
        turnDataOff: undefined,
        updateSettings: undefined,
        pollVersion: undefined,
        getData: undefined,
        getDataParsed: undefined,
        registerNewDataCallback: undefined,
        portList: [],
        preferredPortList: [],
        flexvoltPortList: [],
        tryList: undefined,
        currentPort: undefined,
        connection: {
            version: undefined,
            serialNumber: undefined,
            modelNumber: undefined,
            model: undefined,
            state: undefined,
            data: undefined,
            dataOnRequested: undefined
        },
        debugging: {
            communicationsLog: ''
        },
        settings: {
            currentSignalNumber : 8, 
            userFreqIndex : 7, //userFreqArray = {1, 10, 50, 100, 200, 300, 400, 500, 1000, 1500, 2000};
            userFrequency : 500,
            userFrequencyCustom : 0,
            timer0PartialCount : 0,
            timer0AdjustVal : 2,
            smoothFilterFlag : false,
            bitDepth10 : true,
            prescalerPic : 2,
            smoothFilterVal : 7,
            downSampleCount : 0,
            plugTestDelay : 0
        },
        readParams : {
            expectedChar : undefined,
            expectedBytes: undefined,
            offset: undefined
        }
    };
    
    ionic.Platform.ready(function(){
        
        bluetoothPlugin.subscribe(function(data){
            var bytes = new Uint8Array(data);
            onDataReceived(bytes);
        },function(e){
            console.log('error in subscribe');
            console.log(e);
            if (e.error === 'device_lost'){
                connectionErr('connection lost');
            }
        });
          
        // flag to make sure we don't end up with multipe async read calls at once!
        var checkingForData = false;
        var dIn = [], dataParsed = [];

        var pollingTimeout, newDataCallback,
          DISCOVER_DELAY_MS = 500;

        function init(){
            api.connection.state = 'begin';
            api.connection.data = 'off';
            api.connection.dataOnRequested = false;
            
            // TODO grab settings from local file
            api.settings.currentSignalNumber = 4; 
            api.settings.userFreqIndex = 8;//6,
            api.settings.userFrequency = 1000;//500,
            api.settings.userFrequencyCustom = 0;
            api.settings.timer0PartialCount = 0;
            api.settings.timer0AdjustVal = 2;
            api.settings.smoothFilterFlag = false;
            api.settings.bitDepth10 = true;
            api.settings.prescalerPic = 2;
            api.settings.smoothFilterVal = 8;
            api.settings.downSampleCount = 0;
            api.settings.plugTestDelay = 0;
        }

//        function cancelTimeout() {
//            if ( pollingTimeout ) {
//                $timeout.cancel(pollingTimeout);
//                pollingTimeout = undefined;
//            }
//        }

        api.registerNewDataCallback = function ( cb ) {
            newDataCallback = cb;
            console.log('Registered newDataCallback.');
        };

        // Connection Code.
        function simpleLog(msg) { console.log(msg); }
        
        function connectedCB(){
            console.log('DEBUG: connectedCB');
            turnDataOn();
        }
        function notConnectedCB(){
            console.log('DEBUG: notConnectedCB');
            resetConnection();
        }
        
        // the interval connection check call
        function checkConnection(){
            if (api.connection.state === 'connected' && !api.connection.data === 'on'){
                console.log('DEBUG: Connected NOT taking data');
                // if data off, just handshake.  If the handshake fails (connectionErr, expected return chars not received
//                testHandshake(function(){
//                    //console.log('DEBUG: testHandshake worked');
//                });
            } else if(api.connection.state === 'connected' && api.connection.data === 'on') {
                console.log('DEBUG: Connected and taking data');
                if (receivedData){
                    //connection still good.  reset flag
                    receivedData = false;
                } else {
                    // was data turned off?
                    console.log('ERROR: Stopped getting data.');
                    // check connection
                    bluetoothPlugin.isConnected(connectedCB, notConnectedCB, connectionErr);
                }
            }
        }
        
        // Async event listener function to pass to subscribe/addListener
        function onDataReceived(d){
            receivedData = true;
            var tmpL = dIn.length;
            for (var i = 0; i < d.length; i++){
                dIn[tmpL+i] = d[i];
            }
        }
        
        // Send a command, wait for nBytes, check received bytes against inMsg, call nextFunc!
        function waitForInput(outMsg, waitTime, inMsg, nextFunc){
            if (outMsg !== null){
                console.log('OUTPUT: '+outMsg);
                write(outMsg);
            }
            
            // wait for data to come back
            $timeout(function(){
                while(dIn.length > 0){
                    //console.log('dIn.length = '+dIn.length);
                    var b = dIn.slice(0,1);
                    dIn = dIn.slice(1);
                    if (api.connection.data !== 'turningOff'){
                        console.log('INPUT: '+b+', exp: '+inMsg+', n = '+dIn.length);
                    }
                    if (b[0] === inMsg){
                        //console.log('msg found');
                        nextFunc();
                        return;
                    }
                }
                connectionErr('Expected '+inMsg);
            },waitTime);
        }
        
        function connectionErr(e) {
            console.log('DEBUG: connectionErr: '+JSON.stringify(e));
            $interval.cancel(connectionTestInterval);
            api.connection.data = 'off';
            api.connection.dataOnRequested = false;
            if (api.connection.state === 'searching'){
                console.log('DEBUG: Testing next port');
                bluetoothPlugin.disconnect(tryPorts,simpleLog);
            } else if (api.connection.state === 'connecting'){
                console.log('WARNING: Connection error.  Awaiting input.');
                api.connection.state = 'begin';
                //$timeout(discoverFlexvolts, DISCOVER_DELAY_MS);  // infinite loop!
            } else if (api.connection.state === 'connected'){
                console.log('WARNING: Connection lost!');
                connectionResetHandler(discoverFlexvolts);
            } else {
                console.log('WARNING: Connection dropped!  State: '+api.connection.state);
                connectionResetHandler(discoverFlexvolts);
            }
        }
        function connectionResetHandler(cb){
            console.log('DEBUG: connectionResetHandler');
            $interval.cancel(connectionTestInterval);
            api.connection.state = 'disconnected'; 
            api.connection.data = 'off';
            bluetoothPlugin.disconnect(
                function () { 
                    if (cb){
                        console.log('DEBUG: Reseting Connection.');
                        $timeout(cb,250);
                    } else {
                        api.connection.state ='begin';
                        console.log('DEBUG: Cleared Connection');
                    }
                },
                function () { console.log('Error disconnecting.'); 
            });
        }
        function resetConnection(cb){
            console.log('DEBUG: resetConnection, state:'+api.connection.state);
            if (api.connection.state === 'connecting' || api.connection.state === 'searching'){
                console.log('INFO: connection attempt already in progress');
                return;
            }
            updatePorts();
            $timeout(function(){
                connectionResetHandler(discoverFlexvolts);
            },250);
        }
        function clearConnection(){
            write('X');
            console.log('DEBUG: clearConnection');
            connectionResetHandler(false);
        }
        function convertPortList(btDeviceList){
            var portList = [];
            btDeviceList.forEach(function(device){
                if (window.flexvoltPlatform === 'cordova'){
                    portList.push(device.id);
                } else if (window.flexvoltPlatform === 'chrome'){
                    portList.push(device.path);
                }
            });
            api.portList = portList;
        }
        function updatePorts() {
            console.log('updating portlist');
            bluetoothPlugin.list(convertPortList,simpleLog);
        }
        function discoverFlexvolts() {
            console.log('Listing devices...');
            api.connection.state = 'sesarching';
            bluetoothPlugin.list(handleBTDeviceList, connectionErr);
        }
        function handleBTDeviceList ( deviceList ) {
            console.log('Got device list:');
            
            // convert to an array of portName strings
            convertPortList(deviceList);
            console.log(JSON.stringify(api.portList));
            api.preferredPortList = [];
            api.flexvoltPortList = [];
            
            // look for meaningful names
            api.portList.forEach(function(portName) { 
                if ( portName.indexOf('FlexVolt') > -1 ) {
                    api.preferredPortList.push(portName);
                }
            });
            
            // make tmp portlist 
            api.tryList = api.portList.slice(0);
            
            // move preferred ports to the front
            if (api.preferredPortList.length > 0){
                console.log('Preferred port list:'+JSON.stringify(api.preferredPortList));
                for (var i = 0; i < api.preferredPortList.length; i++){
                    api.tryList.splice(api.tryList.indexOf(api.preferredPortList[i]),1);
                    api.tryList.splice(api.tryList.length,0,api.preferredPortList[i]);
                }
                console.log('Updated tryList: '+JSON.stringify(api.tryList));
            } else {console.log('No preferred ports found');}
            
            
            
            
            // pass it to a function that will try each port
            tryPorts();
            
        }
        function tryPorts(){
            console.log('DEBUG: in tryPorts');
            //console.log(api.tryList);
            // the tryList is a copy of the ports list.  Try each port, then remove it from the list
            // if it's a flexvolt, add that port to flexvoltPortList
            // once the tryList is empty, if we found a flexvolt connect.  Otherwise, error out, go back to begin
            if (api.tryList.length > 0){
                api.currentPort = api.tryList.pop();
                api.connection.state = 'searching';
                attemptToConnect(api.currentPort);
            } else {
                if (api.flexvoltPortList.length > 0){
                    console.log('FlexVolt port list:');
                    console.log(api.flexvoltPortList);
                    api.connection.state = 'connecting';
                    api.currentPort = api.flexvoltPortList[0];
                    attemptToConnect(api.flexvoltPortList[0]);
                } else {
                    console.log('No FlexVolts found!');
                    //didn't find anything?!
                    api.connection.state = 'no flexvolts found';
                }
            }
        }
        function manualConnect(portName){
            console.log('DEBUG: Manual connect '+portName);
            connectionResetHandler(function(){
                api.connection.state = 'connecting';
                api.currentPort = portName;
                attemptToConnect(portName);
            });
        }
        function attemptToConnect ( portName ) {
            console.log('DEBUG: Trying device: ' + portName);
            bluetoothPlugin.connect(portName, connectSuccess, connectionErr);
        }
        function connectSuccess() {
            console.log('DEBUG: Now connected to a port');
            write('X');
            bluetoothPlugin.clear(handshake1, simpleLog);
        }
        function handshake1() {
            $timeout(function(){
                        waitForInput('A',defaultWait,97,handshake2);
                    },2000);   
        }
        function handshake2(){
            console.log('DEBUG: Received "a", writing "1".  (FlexVolt found!)');
            waitForInput('1',defaultWait,98,handshake3);
        }
        function handshake3(){
            console.log('DEBUG: Received "b", handshake complete.');
            // if searching, continue checking next port.  If connecting, initialize device and go
            //console.log('state: '+api.connection.state);
//            if (api.connection.state === 'searching'){
//                console.log('Adding '+api.currentPort+' to flexvoltPortList.');
//                api.flexvoltPortList.push(api.currentPort);
//                connectionResetHandler(tryPorts);
//            } else if (api.connection.state === 'connecting'){
                api.flexvoltPortList.push(api.currentPort);
                api.connection.state = 'connected';
                connectionTestInterval = $interval(checkConnection,1000);
                console.log('Connected to ' + api.currentPort);
                pollVersion();
//            }
        }
        function testHandshake(cb){
            waitForInput('Q',defaultWait,113,cb);
        }
        function pollVersion(){
            api.connection.state = 'polling';
            bluetoothPlugin.clear(
                function () { 
                    waitForInput('V',defaultWait,118,parseVersion);
                },
                function(){console.log('Error clearing in pollVersion');}
            );
        }
        function parseVersion(){
            if (dIn.length >= 4){
                api.connection.state = 'connected';
                var data = dIn.slice(0,4);
                api.connection.version = Number(data[0]);
                api.connection.serialNumber = Number((data[1]*(2^8))+data[2]);
                api.connection.modelNumber = Number(data[3]);
                api.connection.model = modelList[api.connection.modelNumber];
                console.log('Version = '+api.connection.version+'. SerailNumber = '+api.connection.serialNumber+'. MODEL = '+api.connection.model+', from model# '+api.connection.modelNumber);
                dIn = dIn.slice(4);
                updateSettings();
            } else {
                $timeout(parseVersion);
            }
        }
        function updateSettings(){
            if (api.connection.state === 'connected'){
                console.log('Updating Settings');
                api.connection.state = 'updating settings';
                waitForInput('S',defaultWait,115,updateSettings2);
            } else {
                console.log('Cannot Update Settings - not connected');
            }
        }
        function updateSettings2(){
            console.log('Update Settings 2');
            var REG = [];
            var REGtmp = 0;
            var tmp = 0;

            //Register 1
            if (api.settings.currentSignalNumber === 8)tmp = 3;
            if (api.settings.currentSignalNumber === 4)tmp = 2;
            if (api.settings.currentSignalNumber === 2)tmp = 1;
            if (api.settings.currentSignalNumber === 1)tmp = 0;
            REGtmp = tmp << 6;
            REGtmp += api.settings.userFreqIndex << 2;
            tmp = 0;
            if (api.settings.smoothFilterFlag) {
                tmp = 1;
            }
            REGtmp += tmp << 1;
            tmp = 0;
            if (api.settings.bitDepth10) {
                tmp = 1;
            }
            REGtmp += tmp;
            REG.push(REGtmp); // 11110100 (252)

            REGtmp = 0;
            REGtmp += api.settings.prescalerPic << 5;
            REGtmp += api.settings.smoothFilterVal;
            REG.push(REGtmp); // 01001000 72

            REGtmp = api.settings.userFrequencyCustom;
            REGtmp = (Math.round(REGtmp >> 8)<<8);
            REGtmp = api.settings.userFrequencyCustom-REGtmp;
            REG.push(REGtmp); // 00000000

            REGtmp = api.settings.userFrequencyCustom>>8;
            REG.push(REGtmp); // 00000000

            REGtmp = api.settings.timer0AdjustVal+6;
            REG.push(REGtmp); // 00001000 8

            REGtmp = api.settings.timer0PartialCount;
            REGtmp = (Math.round(REGtmp >> 8)<<8);
            REGtmp = api.settings.timer0PartialCount-REGtmp;
            REG.push(REGtmp); // 00000000

            REGtmp = api.settings.timer0PartialCount>>8;
            REG.push(REGtmp); // 00000000

            REGtmp = api.settings.downSampleCount;
            REG.push(REGtmp); // 00000001 1

            REGtmp = api.settings.plugTestDelay;
            REG.push(REGtmp);

            console.log('REG.length='+REG.length);
            var msg = '';
            for (var i = 0; i < REG.length; i++){
                msg += REG[i]+', ';
            }
            console.log('REG='+msg+'bytes/ ='+REG.BYTES_PER_ELEMENT);

            writeBuffer(REG);
            waitForInput(null,4*defaultWait,121,updateSettings3);  
        }
        function updateSettings3(){
            console.log('Update Settings 3');
            waitForInput('Y',defaultWait,122,updateDataSettings);
        }
        function updateDataSettings(){
            api.connection.state = 'connected';
            //console.log('updateDataSettings');
        /* settings read parameters
         * 67'C' = 8 bits, 1ch, 2 Bytes
         * 68'D' = 8 bits, 2ch, 3 Bytes
         * 69'E' = 8 bits, 4ch, 5 Bytes
         * 70'F' = 8 bits, 8ch, 9 Bytes
         *  don't use 10-bit!  the bottom 2 bits of most ADCs are noise anyway!
         * 72'H' = 10bits, 1ch, 3 Bytes
         * 73'I' = 10bits, 2ch, 4 Bytes
         * 74'J' = 10bits, 4ch, 6 Bytes
         * 75'K' = 10bits, 8ch, 11 Bytes
         */

            if (!api.settings.bitDepth10){
                api.readParams.offset = 128;
                if (api.settings.currentSignalNumber === 1){
                    api.readParams.expectedChar = 67;
                    api.readParams.expectedBytes = 2;
                } else if (api.settings.currentSignalNumber === 2){
                    api.readParams.expectedChar = 68;
                    api.readParams.expectedBytes = 3;
                } else if (api.settings.currentSignalNumber === 4){
                    api.readParams.expectedChar = 69;
                    api.readParams.expectedBytes = 5;
                } else if (api.settings.currentSignalNumber === 8){
                    api.readParams.expectedChar = 70;
                    api.readParams.expectedBytes = 9;
                }
            } else if (api.settings.bitDepth10){
                api.readParams.offset = 512;
                if (api.settings.currentSignalNumber === 1){
                    api.readParams.expectedChar = 72;
                    api.readParams.expectedBytes = 3;
                } else if (api.settings.currentSignalNumber === 2){
                    api.readParams.expectedChar = 73;
                    api.readParams.expectedBytes = 4;
                } else if (api.settings.currentSignalNumber === 4){
                    api.readParams.expectedChar = 74;
                    api.readParams.expectedBytes = 6;
                } else if (api.settings.currentSignalNumber === 8){
                    api.readParams.expectedChar = 75;
                    api.readParams.expectedBytes = 11;
                }
            }
            console.log('INFO: Updated settings, read params: '+JSON.stringify(api.readParams));
            if (api.connection.dataOnRequested){
                console.log('DEBUG: dataOnRequested');
                turnDataOn();
            }
        }
        function turnDataOn(){
            console.log('DEBUG: turning data on');
            
            if (api.connection.state === 'connected'){
                api.connection.data = 'turningOn';
                bluetoothPlugin.clear(
                    function () { 
                        console.log('DEBUG: Cleared in turnDataOn.'); 
                        waitForInput('G',defaultWait,103,function(){
                            console.log('Turned data on');
                            api.connection.data = 'on';
                        });
                    },
                    function(msg){
                        api.connection.data = 'off';
                        console.log('ERROR: in clear in turnDataOn');
                        console.log(msg);
                    }
                );
            } else if (api.connection.state === 'update settings' || api.connection.state === 'polling' || api.connection.state === 'connecting'){
                console.log('DEBUG: fail - still initializing');
                api.connection.data = 'off';
            } else {
                console.log('WARNING: fail - not connected');
                api.connection.data = 'off';
            }
        }
        function turnDataOff(){ // 113 = 'q'
            console.log('DEBUG: turning data off');
            if (api.connection.data === 'on'){
                api.connection.data = 'turningOff';
                dIn = [];
                waitForInput('Q',2*defaultWait,113,function(){
                    console.log('DEBUG: data off.');
                    api.connection.data = 'off';
                });
            }  else {console.log('DEBUG: data not on');}
        }
        function getDataParsed(gain){
            var nSamples = 1;//(nSamples !== undefined)?nSamples:1;// can remove this in future
            gain = (gain !== undefined)?gain:1;
            var dataParsed = [];
            if (!checkingForData && api.connection.state === 'connected' && api.connection.data === 'on'){
                checkingForData = true;
                var dataIn = dIn.slice(0);
                if (dataIn.length >= nSamples*api.readParams.expectedBytes){ // remove nSamples in future
                    // initialize parsed data vector
                    dataParsed = new Array(api.settings.currentSignalNumber);
                    for (var i = 0; i < api.settings.currentSignalNumber; i++){ dataParsed[i]=[]; }
                    // Parse channels
                    var readInd = 0, dataInd = 0;
                    while(readInd < (dataIn.length-api.readParams.expectedBytes) ){
                        var tmp = dataIn[readInd++];
                        //console.log(tmp);
                        if (tmp === api.readParams.expectedChar){
                            //console.log('got expected Char '+tmp);
                            if (!api.settings.bitDepth10) {
                                for (var i = 0; i < api.settings.currentSignalNumber; i++){
                                    dataParsed[i][dataInd] = gain*(dataIn[readInd++] - api.readParams.offset); // centering on 0!
                                }
                                dataInd++;
                            } else {
                                var tmpLow = dataIn[readInd+api.settings.currentSignalNumber];
                                //console.log(tmpLow);
                                for (var i = 0; i < api.settings.currentSignalNumber; i++){
                                    dataParsed[i][dataInd] = gain*( (dataIn[readInd++]<<2) + (tmpLow & 3) - api.readParams.offset); // centering on 0!
                                    //console.log(dataParsed[i][dataInd]);
                                    tmpLow = tmpLow >> 2;
                                }
                                readInd++; // for the tmpLow read
                                dataInd++;
                            }
                                
                        } else {
                            console.log('got unexpected Char '+tmp);
                        }
                    }
                    // Remove read samples from the incoming data array
                    dIn = dIn.slice(readInd);
                }
                checkingForData = false;
            }
            // copy, clear, return.  REMEMBER - bluetoothPlugin is ASYNC!
            return dataParsed;
        }
//        function getDataRMS(windowSize){
//            var dataObject = [], nReturned;
//            
//            // append new data for each channel
//            var tmp = getDataParsed();
//            
//            for (var ch in tmp){
//                if (dataParsed[ch] !== angular.undefined){
//                    dataParsed[ch] = dataParsed[ch].concat(tmp[ch]);
//                } else {
//                    dataParsed[ch] = tmp[ch];
//                }
//            }
//            
//            var dLength = undefined;
//            if (dataParsed !== angular.undefined && dataParsed[0] !== angular.undefined){
//                dLength = dataParsed[0].length;
//            }
//            
//            if (windowSize === undefined) {
//                windowSize = dLength;
//                nReturned = dLength;
//            } else {nReturned = windowSize;}
//            
//            function rms(arr){
//                //var sumOfSquares = arr.reduce(function(sum,x){return (sum + (x-127)*(x-127));}, 0);
//                var sumOfSquares = 0;
//                for (var i = 0; i < arr.length; i++){
//                    var tmp = arr[i] - 127;
//                    sumOfSquares += Math.pow(tmp,2);
//                }
//                return Math.sqrt(sumOfSquares/arr.length);
//            };
//            
//            while (dataParsed[0] !== angular.undefined && dataParsed[0].length >= windowSize){
//                var dataRMS = [];
//                for (var i = 0; i < dataParsed.length; i++){
//                    dataRMS[i] = rms(dataParsed[i].splice(0,windowSize));
//                }
//                dataObject.push({data:dataRMS,nSamples:nReturned});
//            }
//            
//            return dataObject;
//        }
        function getData(){
            var dataOut = dIn.slice(0);
            return dataOut;
        }
        function write( data ) {
            //api.debugging.communicationsLog += 'out -> ' + data + '\n';
            bluetoothPlugin.write(data, function(){}, simpleLog);
        }
        function writeBuffer( data ){
            // data can be an array or Uint8Array
            var sendTimer;
            var bufInd = 0;
            var nBytes = data.length;
            //console.log('inside writeBuffer with '+nBytes+' to send in '+data);

            function sendFunc(){
                //console.log('bufInd='+bufInd+', nBytes='+nBytes);
                if (bufInd < nBytes){
                    var tmpBuf = new ArrayBuffer(1);
                    var tmpView = new Uint8Array(tmpBuf);
                    tmpView[0]=data[bufInd];
                    //console.log('buffer is now '+tmpView[0] + ', and index is now '+ bufInd);
                    bluetoothPlugin.write(tmpBuf, function(){}, simpleLog);
                    bufInd++;
                    if (bufInd >= nBytes){
                        $interval.cancel(sendTimer);
                    }
                }
            } 
            sendTimer = $interval(sendFunc, 50, nBytes);
            //api.debugging.communicationsLog += 'out -> ' + data + '\n';
        }

        init();
        // This starts it all!
        $timeout(discoverFlexvolts, DISCOVER_DELAY_MS);
        
        function updateDots(){
            dots += '. ';
            if (dots.length > 12){
                dots = '';
            }
        }
        
        $interval(updateDots, 400);
              
        api.discoverFlexVolts = discoverFlexvolts;
        api.updatePorts = updatePorts;
        api.turnDataOn = function(){
            api.connection.dataOnRequested = true;
            turnDataOn();
        };
        api.turnDataOff = function(){
            api.connection.dataOnRequested = false;
            turnDataOff();
        };
        api.updateSettings = updateSettings;
        api.pollVersion = pollVersion;
        api.getData = getData;
        api.getDataParsed = getDataParsed;
        api.resetConnection = resetConnection; // pass true to reconnect
        api.disconnect = clearConnection; // pass false to sit and do nothing
        api.manualConnect = manualConnect;
    });
    return {
        api : api,
        getConnectionStatus: function(){
            return api.connection.state === 'connected' || api.connection.state === 'polling' || api.connection.state === 'updating settings';
        },
        getDetailedConnectionStatus: function(){
            if (api.connection.state === 'begin'){
                return 'Waiting for Input.  Tap button below to try to connect.';
            } else if (api.connection.state === 'searching'){
                return 'Scanning available ports for FlexVolts. '+dots;
            } else if (api.connection.state === 'connecting'){
                return 'Atempting to establish a connection. '+dots;
            } else if (api.connection.state === 'connected'){
                return 'Connected.';
            } else if (api.connection.state === 'polling'){
                return 'Polling Version. '+dots;
            } else if (api.connection.state === 'updating settings'){
                return 'Updating Settings. '+dots;
            } else if (api.connection.state === 'no flexvolts found'){
                return 'No FlexVolt devices found.  Is your FlexVolt powered on and paired/connected?';
            } else {return 'Info not avaiable.';}
        },
        getPortList: function(){
            return api.portList;
        },
        getPrefPortList: function(){
            return api.preferredPortList;
        }
    };
  }]);
  
  }());