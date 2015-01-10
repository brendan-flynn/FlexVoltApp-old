angular.module('flexvolt.flexvolt', [])

/**
 * Abstracts the flexvolt, deals with bluetooth communications, etc.
 */
  .factory('flexvolt', function($timeout, $interval) {
    // api... contains the API that will be exposed via the 'flexvolt' service.
    api = {
      isConnected: false,
      disconnect: undefined,
      readAll: undefined,
      turnDataOn: undefined,
      turnDataOff: undefined,
      updateSettings: undefined,
      pollVersion: undefined,
      sendTest: undefined,
      flexvoltName: '',
      registerNewDataCallback: undefined,
      debugging: {
        communicationsLog: ''
      }
    };
    
    //var bufInd = 0;
    var buf = new ArrayBuffer(10);
    var view = new Uint8Array(buf);
    view[0] = 0;
    view[1] = 200;
    view[2] = 17;
    view[3] = 0;
    view[4] = 255;
    view[5] = 57;
    view[6] = 190;
    view[7] = 170;
    view[8] = 10;
    view[9] = 253;

    var pollingTimeout, newDataCallback,
      DISCOVER_DELAY_MS = 500;

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
        }
      );
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
      collectNBytes(2,handshake2);
    }
    function handshake2(data) {
      if ( data === 'Aa' ) {
        console.log('Got back "a", writing "1".');
        write('1');
        collectNBytes(2,handshake3);
      } else {
        connectionErr('Expected to receive "a"; received "' + data + '". Aborting.');
      }
    }
    function handshake3(data) {
      if ( data === '1b' ) {
        console.log('Got back "b", handshake complete.');
        api.isConnected = true;
        console.log('Connected to ' + api.flexvoltName );
        pollVersion();
      } else {
        connectionErr('Expected to receive "b"; received "' + data + '". Aborting.');
      }
    }
    function turnDataOn(){
        write('G');
        collectNBytes(2,function(data){
            if (data ==='Gg'){
                console.log('turned data on');
            } else {
                console.log('could not turn data on');
            }
        })
    }
    function turnDataOff(){
        write('Q');
        collectNBytes(2,function(data){
            if (data ==='Qq'){
                console.log('turned data off');
            } else {
                console.log('could not turn data off');
            }
        })
    }
    function updateSettings(){
        //console.log('clearing to update settings');
        //bluetoothSerial.clear();
        write('S');
        collectAllBytes(6,function(data){
            console.log('updatesettings data returned = ');
            console.log(data);
            for (var i = 0; i < data.length; i++){
                if ( data[i] === 115){
                    console.log('inside settings');
                    finishUpdate();
                }
            }
            
        });
    }
    function finishUpdate(){
        var currentSignalNumber = 8, 
                userFreqIndex = 6,
                userFrequency = 500,
                userFrequencyCustom = 430,
                timer0PartialCount = 500,
                timer0AdjustVal = 2,
                smoothFilterFlag = false,
                bitDepth10 = false,
                prescalerPic = 2,
                smoothFilterVal = 8,
                downSampleCount = 1,
                plugTestDelay = 0
                ;
        
        
        var REG = [];
        var REGtmp = 0;
        var tmp = 0;
        //Register 1
        if (currentSignalNumber === 8)tmp = 3;
        if (currentSignalNumber === 4)tmp = 2;
        if (currentSignalNumber === 2)tmp = 1;
        if (currentSignalNumber === 1)tmp = 0;
        REGtmp = tmp << 6;
        REGtmp += userFreqIndex << 2;
        tmp = 0;
        if (smoothFilterFlag) {
          tmp = 1;
        }
        REGtmp += tmp << 1;
        tmp = 0;
        if (bitDepth10) {
          tmp = 1;
        }
        REGtmp += tmp;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 11110100 (252)

        REGtmp = 0;
        REGtmp += prescalerPic << 5;
        REGtmp += smoothFilterVal;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 01001000 72

        REGtmp = userFrequencyCustom;
        REGtmp = (Math.round(REGtmp >> 8)<<8);
        REGtmp = userFrequencyCustom-REGtmp;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00000000

        REGtmp = userFrequencyCustom>>8;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00000000

        REGtmp = timer0AdjustVal+6;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00001000 8

        REGtmp = timer0PartialCount;
        REGtmp = (Math.round(REGtmp >> 8)<<8);
        REGtmp = timer0PartialCount-REGtmp;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00000000

        REGtmp = timer0PartialCount>>8;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00000000

        REGtmp = downSampleCount;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp); // 00000001 1

        REGtmp = plugTestDelay;
        REG.push(REGtmp);
        //trySendChar((char)REGtmp);
        
        console.log('REG.length='+REG.length);
        var msg = '';
        for (var i = 0; i < REG.length; i++){
            msg += REG[i]+', ';
        }
        console.log('REG='+msg+'bytes/ ='+REG.BYTES_PER_ELEMENT);

        var REG8 = new Uint8Array(REG);
        console.log('REG8.length='+REG8.length);
        msg = '';
        for (var i = 0; i < REG8.length; i++){
            msg += REG8[i]+', ';
        }
        console.log('REG8='+msg+'bytes/ ='+REG8.BYTES_PER_ELEMENT);
        
        writeBuffer(REG8,9);
        //collectAllBytes(30,function(data){});
        //write('Y');
    }
    function pollVersion(){
        bluetoothSerial.clear();
        write('V');
//        collectAllBytes(2,function(data){
//            if (data === 'Vv'){
//                //collectAllBytes();
//            }
//        });
    }
    function sendTest(){
        var sendTimer;
//        var m = [12, 10];
//        var m8 = new Uint8Array(m);
        
        // The Winner!
        // This method works for [5, 10] & [50, 100]  & [150, 200], using writeBuffer !!
        // does not work for longer arrays!?  2-3 seems to work, but 5 does not...
//        var ind = 0;
//        var buf = new ArrayBuffer(2);
//        var view = new Uint8Array(buf);
//        view[0] = 0;
//        view[1] = 200;
//        view[2] = 17;
//        view[3] = 0;
//        view[4] = 255;
//        //write(view); //does NOT work
//        //write(buf); //does NOT work
//        writeBuffer(buf);
        
        
        
//        tmpView[0]=view[bufInd];
//        console.log('buffer is now '+tmpView[0] + ', and index is now '+ bufInd);
//        writeBuffer(tmpBuf);
//        bufInd++;
        var bufInd = 0;
        
        function sendFunc(){
            var tmpBuf = new ArrayBuffer(1);
            var tmpView = new Uint8Array(tmpBuf);
            tmpView[0]=view[bufInd];
            console.log('buffer is now '+tmpView[0] + ', and index is now '+ bufInd);
            writeBuffer(tmpBuf);
            bufInd++;
            bufInd = bufInd%10;
            if (bufInd >= 10){
                $interval.cancel(sendTimer);
            }
        }
//        
        sendTimer = $interval(sendFunc, 50, 5);
//        
        sendFunc();
        
        // using write(ss) works, but only for 7-bit numbers! - BPF
        //var ss = String.fromCharCode.apply(null, new Uint8Array(m));
        //console.log('string = '+ss+', l='+ss.length);
        
        // write(m) produces gibberish for 240
        // write(m8) produces even more gibberish for 240!
        
//        writeBuffer(m8); //also produces gibberish for 240 or 120!??
//        writeBuffer(buf);
    }
    function parseVersion(data){
        var data2 = new Uint8Array(data);
        var flexvoltVersion = Number(data2[0]);
        var flexvoltSerialNumber = Number((data2[1]*(2^8))+data2[2]);
        var flexvoltModelNumber = Number(data2[3]);
        console.log("Version = "+flexvoltVersion+". SerailNumber = "+flexvoltSerialNumber+". MODEL = "+flexvoltModelNumber);
    }
//    function collect(){
//        var poll;
//      function pollFunc () {
//        bluetoothSerial.available(
//          function ( nBytesAvailable ) {
//            if ( nBytesAvailable > 0 ) {
//              $interval.cancel(poll);
//              // DOES NOT WORK FOR BYTES FROM FLEXVOLT...
//              bluetoothSerial.read(readSuccess, simpleLog);
//            }
//          },
//          simpleLog
//        );
//      }
//      function readSuccess ( data ) {
//        // none of these make bluetoothSerial.read work for bytes - they all return gibberish!!!
//        console.log('Received ' + data + ' with length ' + data.length);
//        console.log(data);
//        var utf8 = unescape(encodeURIComponent(data));
//        var arr = [];
//        for (var i=0; i<utf8.length;i++){
//            arr.push(utf8.charCodeAt(i));
//        }
//        
//        var arr3 = [];
//        for (var i=0; i<data.length;i++){
//            arr3.push(data.charCodeAt(i));
//        }
//        
//        var arr2 = new Uint8Array(data.length);
//        for (var i=0; i < data.length; i++) {
//            arr2[i] = data.charCodeAt(i);
//        }
//
//        console.log('Converted ' + arr + ' with length ' + arr.length);
//        var msg = '';
//        for (var i = 0; i < arr2.length; i++){
//            msg+= arr2[i]+',';
//        }
//        console.log('Converted ' + msg + ' with length ' + arr2.length);
//        console.log('Converted ' + arr3 + ' with length ' + arr3.length);
//        
//      }
//      poll = $interval(pollFunc, 50, 20);
//      pollFunc();
//    }
    function collectAllBytes(nBytes, cb) {
      nBytes = nBytes | 1;
      var poll;
      function pollFunc () {
        bluetoothSerial.available(
          function ( nBytesAvailable ) {
            if (nBytesAvailable >= nBytes) {
                $interval.cancel(poll);
                console.log(nBytesAvailable+' bytes available');
                api.debugging.communicationsLog += 'in <-- ' + nBytesAvailable + '\n';
                // WORKS FOR BYTES FROM FLEXVOLT
                bluetoothSerial.readBuffer(readSuccess, simpleLog);
            }
          },
          simpleLog
        );
      }
      function readSuccess ( data ) {
        var arr = new Uint8Array(data);
        var msg = '';
        for (var i = 0; i < arr.length; i++){
            msg += arr[i]+', ';
        }
        console.log('Received ' +arr+' with vals '+msg+'and length '+arr.length);
        cb(arr);
      }
      poll = $interval(pollFunc, 50, 20);
      pollFunc();
    }
    function collectNBytes(nBytes, cb) {
      var poll;
      function pollFunc () {
        bluetoothSerial.available(
          function ( nBytesAvailable ) {
            if ( nBytesAvailable >= nBytes ) {
              $interval.cancel(poll);
              bluetoothSerial.read(readSuccess, simpleLog);
            }
          },
          simpleLog
        );
      }
      function readSuccess ( data ) {
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
      pollFunc();
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
    $timeout(discoverFlexvolts, DISCOVER_DELAY_MS);
    api.discoverFlexVolts = discoverFlexvolts;
    api.disconnect = connectionErr;
    api.readAll = collectAllBytes;
    api.turnDataOn = turnDataOn;
    api.turnDataOff = turnDataOff;
    api.updateSettings = updateSettings;
    api.pollVersion = pollVersion;
    api.sendTest = sendTest;
    return api;
  });
