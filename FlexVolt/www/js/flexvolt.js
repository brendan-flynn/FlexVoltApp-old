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
      flexvoltName: '',
      registerNewDataCallback: undefined,
      debugging: {
        communicationsLog: ''
      }
    };

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
    }
    function turnDataOff(){
        write('Q');
    }
    function updateSettings(){
        write('S');
        collectNBytes(2,function(data){
            if ( data === 'Ss'){
                finishUpdate();
            }
        });
    }
    function finishUpdate(){
        var currentSignalNumber = 8, 
                userFreqIndex = 7,
                userFrequency = 500,
                userFrequencyCustom = 0,
                timer0PartialCount = 0,
                timer0AdjustVal = 2,
                smoothFilterFlag = false,
                bitDepth10 = false,
                prescalerPic = 2,
                smoothFilterVal = 8,
                downSampleCount = 1,
                plugTestDelay
                ;
        
        
        
        var REG = new Uint8Array(9);
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
        REG[0] = REGtmp;
        //trySendChar((char)REGtmp);//10100001

        REGtmp = 0;
        REGtmp += prescalerPic << 5;
        REGtmp += smoothFilterVal;
        REG[1] = REGtmp;
        console.log('REG[1]='+REG[1]);
        //trySendChar((char)REGtmp);//01000101

        REGtmp = userFrequencyCustom;
        REG[2] = REGtmp;
        //trySendChar((char)REGtmp);

        REGtmp = userFrequencyCustom>>8;
        REG[3] = REGtmp;
        //trySendChar((char)REGtmp);

        REGtmp = timer0AdjustVal+6;
        REG[4] = REGtmp;
        //trySendChar((char)REGtmp);

        REGtmp = timer0PartialCount;
        REG[5] = REGtmp;
        //trySendChar((char)REGtmp);

        REGtmp = timer0PartialCount>>8;
        REG[6] = REGtmp;
        console.log('REG[6]='+REG[6]);
        //trySendChar((char)REGtmp);

        REGtmp = downSampleCount;
        REG[7] = REGtmp;
        //trySendChar((char)REGtmp);

        REGtmp = plugTestDelay;
        REG[8] = REGtmp;
        //trySendChar((char)REGtmp);
        
        console.log('REG.length='+REG.length);
        var msg = '';
        for (var i = 0; i < REG.length; i++){
            msg += REG[i]+', ';
        }
        console.log('REG='+msg+', bytes/ ='+REG.BYTES_PER_ELEMENT);

        write(REG);
        collectNBytes(9,handshake3);
        write('Y');
    }
    function pollVersion(){
        write('V');
        collectNBytes(5,parseVersion);
    }
    function parseVersion(data){
        data = new Uint8Array(data);
        var flexvoltVersion = Number(data[1]);
        var flexvoltSerialNumber = Number((data[2]*(2^8))+data[3]);
        var flexvoltModelNumber = Number(data[4]);
        console.log("Version = "+flexvoltVersion+". SerailNumber = "+flexvoltSerialNumber+". MODEL = "+flexvoltModelNumber);
    }
    function collectAllBytes(cb) {
      var poll;
      function pollFunc () {
        bluetoothSerial.available(
          function ( nBytesAvailable ) {
            $interval.cancel(poll);
            console.log(nBytesAvailable+' bytes available');
            api.debugging.communicationsLog += 'in <-- ' + nBytesAvailable + '\n';
            bluetoothSerial.read(readSuccess, simpleLog);
          },
          simpleLog
        );
      }
      function readSuccess ( data ) {
        console.log('Received ' + data + ', with length ' + data.length);
        //console.log('Invoking callback with data ' + data);
        //cb(data);
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
        console.log('Received ' + data);
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
    $timeout(discoverFlexvolts, DISCOVER_DELAY_MS);
    api.discoverFlexVolts = discoverFlexvolts;
    api.disconnect = connectionErr;
    api.readAll = collectAllBytes;
    api.turnDataOn = turnDataOn;
    api.turnDataOff = turnDataOff;
    api.updateSettings = updateSettings;
    api.pollVersion = pollVersion;
    return api;
  });
