/* Original Author: Rob Chambers!
 * Updated and modified by: Brendan Flynn
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

angular.module('flexvolt.flexvolt', [])

/**
 * Abstracts the flexvolt, deals with bluetooth communications, etc.
 */
  .factory('flexvolt', function($timeout, $interval) {
    // api... contains the API that will be exposed via the 'flexvolt' service.
    api = {
        isConnected: false,
        disconnect: undefined,
        collectAllBytes: undefined,
        turnDataOn: undefined,
        turnDataOff: undefined,
        updateSettings: undefined,
        pollVersion: undefined,
        getData: undefined,
        getDataParsed: undefined,
        flexvoltName: '',
        dataV: undefined,
        registerNewDataCallback: undefined,
        debugging: {
            communicationsLog: ''
        },
        settings: {
            currentSignalNumber : 8, 
            userFreqIndex : 7,//6, //userFreqArray = {1, 10, 50, 100, 200, 300, 400, 500, 1000, 1500, 2000};
            userFrequency : 500,//500,
            userFrequencyCustom : 0,
            timer0PartialCount : 0,
            timer0AdjustVal : 2,
            smoothFilterFlag : false,
            bitDepth10 : false,
            prescalerPic : 2,
            smoothFilterVal : 8,
            downSampleCount : 1,
            plugTestDelay : 0
        },
        readParams : {
            expectedChar : undefined,
            expectedBytes: undefined
        }
    };
          
    // flag to make sure we don't end up with multipe async read calls at once!
    var reading = false;
    var checkingForData = false;
    var dataV = [], dataParsed = [], dataOut = [];
    var dataOverFlow = [];
    

    var pollingTimeout, newDataCallback,
      DISCOVER_DELAY_MS = 500;

    function init(){
        api.settings.currentSignalNumber = 8; 
        api.settings.userFreqIndex = 7;//6,
        api.settings.userFrequency = 500;//500,
        api.settings.userFrequencyCustom = 0;
        api.settings.timer0PartialCount = 0;
        api.settings.timer0AdjustVal = 2;
        api.settings.smoothFilterFlag = false;
        api.settings.bitDepth10 = false;
        api.settings.prescalerPic = 2;
        api.settings.smoothFilterVal = 8;
        api.settings.downSampleCount = 1;
        api.settings.plugTestDelay = 0;
        
        for (var i = 0; i < api.settings.currentSignalNumber; i++){
            dataParsed[i] = [];
        }
    }

    function cancelTimeout() {
        if ( pollingTimeout ) {
            $timeout.cancel(pollingTimeout);
            pollingTimeout = undefined;
        }
    }

    api.registerNewDataCallback = function ( cb ) {
        newDataCallback = cb;
        console.log('Registered newDataCallback.');
    };

    // Connection Code.
    function simpleLog(msg) { console.log(msg); }
    function readFail(msg){
        reading = false;
        console.log('read failure with msg '+msg);
    }
    function connectionErr(e) {
        console.log(e);
        console.log('Connection did not work. Starting over.');
        api.isConnected = false;
        api.flexvoltName = '';
        bluetoothSerial.disconnect(
            function () { console.log('Disconnected.'); },
            function () { console.log('Error disconnecting.'); });
        bluetoothSerial.clear(
            function () { console.log('Cleared.'); },
            function () { console.log('Error clearing.'); });
        console.log(e);
        $timeout(discoverFlexvolts, DISCOVER_DELAY_MS);
    }
    function discoverFlexvolts() {
        console.log('Listing devices...');
        bluetoothSerial.list(handleBTDeviceList, connectionErr);
    }
    function handleBTDeviceList ( btDeviceList ) {
        console.log('Got device list:');
        console.log(btDeviceList);
        btDeviceList.forEach(function(device) { 
            if ( device.name.slice(0,8) === 'FlexVolt' ) {
                console.log('Found a FlexVolt:' + device.name);
                console.log(device);
                api.flexvoltName = device.name;
                attemptToConnect(device.id);
            }
        });
    }
    function attemptToConnect ( deviceId ) {
        console.log('Attempting to connect to device with id: ' + deviceId);
        bluetoothSerial.connect(deviceId, connectSuccess, connectionErr);
    }
    function connectSuccess() {
        console.log('Now connected to FlexVolt via Bluetooth.');
        bluetoothSerial.clear(
            function () { console.log('Cleared.'); },
            function () { console.log('Error clearing.'); });
        handshake1();
    }
    function handshake1() {
        console.log('Writing "A"');
        write('A');
        collectNChars(2,handshake2);
    }
    function handshake2(data) {
        if ( data === 'Aa' ) {
            console.log('Got back "a", writing "1".');
            write('1');
            collectNChars(2,handshake3);
        } else {
          connectionErr('Expected to receive "a"; received "' + data + '". Aborting.');
        }
    }
    function handshake3(data) {
      if ( data === '1b' ) {
        console.log('Got back "b", handshake complete.');
        api.isConnected = true;
        dataV = [];
        console.log('Connected to ' + api.flexvoltName );
        pollVersion();
      } else {
        connectionErr('Expected to receive "b"; received "' + data + '". Aborting.');
      }
    }
//    function sendExpect(outChar, N, expected, success, fail){
//        write(outChar);
//        collectNBytes(N, function(data){
//            console.log('In sendExpect, data length = '+data.length);
//            for (var i = 0; i < data.length; i++){
//                if ( data[i] === expected){ // 103 = 'g'
//                    success();
//                    return;
//                }
//            }
//            fail();
//        });
//    }
    function turnDataOn(){
        bluetoothSerial.clear(
//            sendExpect('G',2,103,simpleLog('succ'),simpleLog('fail')),
            function () { 
                console.log('Cleared in turnDataOn.'); 
                write('G');
                collectNBytes(2,function(data){
                    console.log(data);
                    for (var i = 0; i < data.length; i++){
                        if ( data[i] === 103){ // 103 = 'g'
                            console.log('turned data on');
                            return;
                        }
                    }
                    console.log('could not turn data on');
                });
            },
            function(){console.log('error clearing to turn data on');}
        );
    }
    function turnDataOff(){ // 113 = 'q'
        write('Q');
        collectAllBytes(function(data){
            if (data === 113){
                console.log('turned data off');
                bluetoothSerial.clear(simpleLog('cleared'),simpleLog('error clearing'));
                dataV = [];
            } else {
                console.log('could not turn data off');
            }
        });
    }
    function updateSettings(){
        //console.log('clearing to update settings');
        //bluetoothSerial.clear(); // BPF commented - appeared to clear things still to come!
        write('S');
        collectNBytes(2,function(data){
            console.log('updatesettings data returned = ');
            console.log(data);
            for (var i = 0; i < data.length; i++){
                if ( data[i] === 115){ // 115 = 's'
                    console.log('inside settings');
                    updateSettings2();
                }
            }
        });
    }
    function updateSettings2(){
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
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 11110100 (252)

        REGtmp = 0;
        REGtmp += api.settings.prescalerPic << 5;
        REGtmp += api.settings.smoothFilterVal;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 01001000 72

        REGtmp = api.settings.userFrequencyCustom;
        REGtmp = (Math.round(REGtmp >> 8)<<8);
        REGtmp = api.settings.userFrequencyCustom-REGtmp;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00000000

        REGtmp = api.settings.userFrequencyCustom>>8;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00000000

        REGtmp = api.settings.timer0AdjustVal+6;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00001000 8

        REGtmp = api.settings.timer0PartialCount;
        REGtmp = (Math.round(REGtmp >> 8)<<8);
        REGtmp = api.settings.timer0PartialCount-REGtmp;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00000000

        REGtmp = api.settings.timer0PartialCount>>8;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00000000

        REGtmp = api.settings.downSampleCount;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00000001 1

        REGtmp = api.settings.plugTestDelay;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp);
        
        console.log('REG.length='+REG.length);
        var msg = '';
        for (var i = 0; i < REG.length; i++){
            msg += REG[i]+', ';
        }
        console.log('REG='+msg+'bytes/ ='+REG.BYTES_PER_ELEMENT);

//        var REG8 = new Uint8Array(REG);
//        console.log('REG8.length='+REG8.length);
//        msg = '';
//        for (var i = 0; i < REG8.length; i++){
//            msg += REG8[i]+', ';
//        }
//        console.log('REG8='+msg+'bytes/ ='+REG8.BYTES_PER_ELEMENT);
        
        writeBuffer(REG,9);

        collectNBytes(28,function(data){
            console.log('updatesettings2 data returned = ');
            console.log(data);
            for (var i = 0; i < data.length; i++){
                if ( data[i] === 121){ // 121 = 'y'
                    console.log('got y from updating settings');
                    updateSettings3();
                }
            }
        });   
    }
    function updateSettings3(){
        write('Y');
        collectNBytes(2,function(data){
            console.log('updateSettings3 data returned = ');
            console.log(data);
            for (var i = 0; i < data.length; i++){
                if ( data[i] === 122){ // 122 = 'z'
                    console.log('got z from updating settings')
                    updateDataSettings();
                }
            }
        });
    }
    function updateDataSettings(){
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
        
    }
    function pollVersion(){
        bluetoothSerial.clear(
            function () { 
                console.log('Cleared.'); 
                write('V');
                collectNBytes(6,function(data){
                    for (var i = 0; i < data.length; i++){
                        if ( data[i] === 118){ // 118 = 'v'
                            console.log('got version info');
                            var ver = data.subarray(i+1);
                            console.log(ver);
                            parseVersion(ver);
                            return;
                        }
                    }
                    console.log('did not get version info');
                });
            },
            function(){console.log('error clearing to poll version');}
        );
    }
    function parseVersion(data){
        var flexvoltVersion = Number(data[0]);
        var flexvoltSerialNumber = Number((data[1]*(2^8))+data[2]);
        var flexvoltModelNumber = Number(data[3]);
        console.log("Version = "+flexvoltVersion+". SerailNumber = "+flexvoltSerialNumber+". MODEL = "+flexvoltModelNumber);
        updateSettings();
    }
    function getDataParsed(){
        if (!checkingForData){
            checkingForData = true;
            bluetoothSerial.availableBytes(function (nBytesAvailable){
                if ((nBytesAvailable+dataOverFlow.length) >= api.readParams.expectedBytes){
                    console.log('nBytes = '+nBytesAvailable);
                    collectAllBytes(function(dataIn){
                        // prepend over flow from previous
                        dataIn = dataOverFlow.concat(dataIn);
                        dataOverFlow = [];
                        // calculate number of full samples
                        //console.log(dataIn);
                        //console.log(dataIn.length+' length, of '+api.readParams.expectedBytes+', expected');
                        var nSamples = Math.floor(0.01+(dataIn.length/api.readParams.expectedBytes));
                        //console.log(nSamples+' samples receiveded');
                        // initializeing parsed data vector
                        dataParsed = new Array(api.settings.currentSignalNumber);
                        for (var i = 0; i < api.settings.currentSignalNumber; i++){ dataParsed[i]=[]; }
                        // Parse channels
                        for (var i = 0; i < nSamples; i++){
                            //console.log('first Char = '+dataIn[i*api.readParams.expectedBytes]);
                            for (var j = 0; j < api.settings.currentSignalNumber; j++){
                                dataParsed[j][i] = dataIn[i*api.readParams.expectedBytes+j+1];
                            }
                        }
                        // Store any partial samples in over flow
                        dataOverFlow = dataOverFlow.concat(dataIn.slice(nSamples*api.readParams.expectedBytes));
                    });
                }
                checkingForData = false;
            },function(msg){
                console.log('bluetoothSerial.available() failed in getDataparsed');
                console.log(msg);
                checkingForData = false;
            });
        }
        // copy, clear, return.  REMEMBER - bluetoothSerial is ASYNC!
        dataOut = dataParsed;
        dataParsed = new Array(api.settings.currentSignalNumber);
        for (var i = 0; i < api.settings.currentSignalNumber; i++){
            dataParsed[i]=[];
        }
        return dataOut;
    }
    function getData(){
        collectAllBytes(function(dataIn){
            dataV = dataIn;
        });
        var dataOut = dataV;
        dataV = [];
        return dataOut;
    }
    function collectAllBytes(cb) {
        //console.log('collecting');
        //var t;
        //var elapsed;
        function pollFunc () {
            //t = new Date().getMilliseconds();
            if (!reading){
                reading = true;
                bluetoothSerial.readBuffer(readSuccess, readFailTryAgain);
            }
        }
        function readSuccess ( data ) {
            reading = false;
            //elapsed = (new Date().getMilliseconds())-t;
            //console.log(elapsed +'ms');
            var arr = new Uint8Array(data);
            //console.log(arr);
            var norm = Array.prototype.slice.call(arr);
            //console.log(norm);
            cb(norm);
        }
        function readFailTryAgain(msg){
            reading = false;
            console.log('read failed, probably null msg = '+msg);
            //collectAllBytes(cb);
        }
        pollFunc();
        //$timeout(pollFunc, 100);
    }
//    function collectOnlyNBytes(nBytes, cb){
//        var poll;
//        function pollFunc () {
//            bluetoothSerial.availableBytes(
//                function ( nBytesAvailable ) {
//                    console.log(nBytes + ' sought, '+nBytesAvailable+' available');
//                    if ( nBytesAvailable >= nBytes ) {
//                        $interval.cancel(poll);
//                        console.log('calling readBufferNBytes in collectOnlyNBytes');
//                        bluetoothSerial.readBufferNBytes(nBytes, readSuccess, simpleLog);
//                    }
//              }, simpleLog);
//        }
//        function readSuccess ( dataIn ) {
//            var data8 = new Uint8Array(dataIn);
//            api.debugging.communicationsLog += 'inN <-- ' + data8.length + '\n';
//            console.log(data8);
//            cb(data8);
//        }
//        poll = $interval(pollFunc, 50, 20);
//    }
    function collectNBytes(nBytes, cb) {
        var poll;
        var dataV = new Uint8Array(0);
        var dataMinLength = nBytes;
        nBytes = nBytes | 1;
        function pollFunc () {
            if (!reading){
                reading = true;
                bluetoothSerial.readBuffer(readSuccess, readFail );
            }
        }
        function readSuccess ( dataIn ) {
            reading = false;
            var data8 = new Uint8Array(dataIn);
            //console.log(data8);
            var tmp = dataV;
            dataV = new Uint8Array(tmp.length+data8.length);
            dataV.set(tmp);
            dataV.set(data8,tmp.length);
            console.log(dataV);
            if (dataV.length >= dataMinLength){
                $interval.cancel(poll);
                cb(dataV);
            }
        }
        poll = $interval(pollFunc, 100);
    }
    function collectNChars(nBytes, cb){
        var poll;
        function pollFunc () {
            bluetoothSerial.available(
                function ( nBytesAvailable ) {
                    if ( nBytesAvailable >= nBytes ) {
                        $interval.cancel(poll);
                        if (!reading){
                            reading = true;
                            bluetoothSerial.read(readSuccess, readFail);
                        }
                    }
              }, simpleLog);
        }
        function readSuccess ( data ) {
            reading = false;
            api.debugging.communicationsLog += 'in <-- ' + data + '\n';
            console.log('Received ' + data + ' with length ' + data.length);
            if ( data.length > nBytes ) {
                console.log('WARNING: Truncating ' + data.length + 'bytes to ' + nBytes + ' bytes.');
                data = data.slice(0,nBytes);
            }
            console.log('Invoking callback with data ' + data);
            cb(data);
        }
        poll = $interval(pollFunc, 50, 20);
        //pollFunc();
    }
    function write( data ) {
        api.debugging.communicationsLog += 'out -> ' + data + '\n';
        bluetoothSerial.write(data, simpleLog, simpleLog);
    }
    function writeBuffer( data ){
        // data can be an array or Uint8Array
        var sendTimer;
        var bufInd = 0;
        var nBytes = data.length;
        console.log('inside writeBuffer with '+nBytes+' to send in '+data);

        function sendFunc(){
            console.log('bufInd='+bufInd+', nBytes='+nBytes);
            if (bufInd < nBytes){
                var tmpBuf = new ArrayBuffer(1);
                var tmpView = new Uint8Array(tmpBuf);
                tmpView[0]=data[bufInd];
                console.log('buffer is now '+tmpView[0] + ', and index is now '+ bufInd);
                bluetoothSerial.writeBuffer(tmpBuf);
                bufInd++;
                if (bufInd >= nBytes){
                    $interval.cancel(sendTimer);
                }
            }
        } 
        sendTimer = $interval(sendFunc, 50, nBytes);
        api.debugging.communicationsLog += 'out -> ' + data + '\n';
    }
    
    init();
    // This starts it all!
    $timeout(discoverFlexvolts, DISCOVER_DELAY_MS);
    
    api.discoverFlexVolts = discoverFlexvolts;
    api.disconnect = connectionErr;
    api.collectAllBytes = collectAllBytes;
    api.turnDataOn = turnDataOn;
    api.turnDataOff = turnDataOff;
    api.updateSettings = updateSettings;
    api.pollVersion = pollVersion;
    api.getData = getData;
    api.getDataParsed = getDataParsed;
    return api;
  });
