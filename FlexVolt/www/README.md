Ionic is the SDK used to develop the flexvolt app.  For more info see [Ionic Framework](http://ionicframework.com/).

## How to use this app

*This app does not work on its own*. It is missing the Ionic library, and AngularJS.

To develop this app, either create a new ionic project using the ionic node.js utility, or copy and paste this into an existing Cordova project and download a release of Ionic separately.

## Things to install

node.js: go here http://nodejs.org/ and install.  Includes npm (node package manager):

Open a terminal - you will use it to run the rest of the necessary commands!

Make sure npm is up to date: sudo npm install npm -g

global installs:
bower:  npm install -g bower
ionic and cordova:  bower install -g ionic cordova

project installs/plugins:
d3:  bower install d3
ionicons:  bower install ionicons
bluetoothSerial:  cordova plugin add com.megster.cordova.bluetoothserial

### With the Ionic tool:

Take the name after `ionic-starter-`, and that is the name of the template to be used when using the `ionic start` command below:

```bash
$ sudo npm install -g ionic cordova
$ ionic start myApp tabs
```

Then, to run in emulator mode, cd into `myApp` and run:

```bash
$ ionic platform add ios
$ ionic build ios
$ ionic emulate ios
```

Then, to run on a device, cd into `myApp` and run:

```bash
$ ionic platform add ios
$ ionic build ios
$ ionic run ios
```

Substitute ios for android if not on a Mac, but if you can, the ios development toolchain is a lot easier to work with until you need to do anything custom to Android.

## Demo
TODO: update this link.  http://plnkr.co/edit/qYMCrt?p=preview

## Issues
TODO - enable issues
