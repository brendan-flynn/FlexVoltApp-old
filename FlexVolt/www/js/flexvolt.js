angular.module('flexvolt.flexvolt', [])

/**
 * Abstracts the flexvolt, deals with bluetooth communications, etc.
 */
  .factory('flexvolt', function($timeout, $interval) {
    // api... contains the API that will be exposed via the 'flexvolt' service.
    api = {
      isConnected: false,
      disconnect: undefined,
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
    }

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
            console.log(device)
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
      } else {
        connectionErr('Expected to receive "b"; received "' + data + '". Aborting.');
      }
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
    return api;
  });
