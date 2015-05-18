/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Original Author:  Brendan Flynn
 * 
 * app controllers
 * 
 */
(function () {
    'use strict';
    
    // convenience function for adding a popover
    function addPopover(ionicPopover, scope_, popName, html, updateFunction){
        ionicPopover.fromTemplateUrl(html, {
            scope: scope_
        }).then(function(popover) {
            scope_[popName] = popover;
        });
        scope_.$on('$destroy', function() {  scope_[popName].remove();  });
        if (updateFunction){
            scope_.$on('popover.hidden', function() {    updateFunction();  });
        }
    }

    angular.module('flexvolt.controllers', [])
    .controller('HomeCtrl', ['$scope', function($scope){
        $scope.apps = 
            {  row1:

                {
                    b1: {
                        icon:"icon ion-information-circled",
                        ref:"intro",
                        btnName:"Get Started"
                    },
                    b2: {
                        icon:"icon ion-ios-pulse-strong",
                        ref:"trace",
                        btnName:"Trace"
                    },
                    b3: {
                        icon:"icon ion-ios-navigate",
                        ref:"xy",
                        btnName:"Go Dot"
                    },
                    b4: {
                        icon:"icon ion-ios-game-controller-b",
                        ref:"snake",
                        btnName:"Snake Game"
                    }
                },
                row2:
                {    
                    b1:{
                        icon:"icon ion-speedometer",
                        ref:"myometer",
                        btnName:"Myometer"
                    },
                    b2:{
                        icon:"icon ion-ios-heart",
                        ref:"ekg",
                        btnName:"EKG"

                    },
                    b3:{
                        icon:"icon ion-android-stopwatch",
                        ref:"hrv",
                        btnName:"HRV"
                    },
                    b4:{
                        icon:"icon ion-ios-pulse",
                        ref:"rms-time",
                        btnName:"RMS Plot"
                    }
//                    b4:{
//                        icon:"icon ion-leaf",
//                        ref:"home",
//                        btnName:"Relax"                 
//                    }
                },
//                row3:{   
//                    b1:{
//                        icon:"icon ion-nuclear",
//                        ref:"home",
//                        btnName:"activity"
//                    },
//                    b2:{
//                        icon:"icon ion-ios-infinite",
//                        ref:"home",
//                        btnName:"mind"
//                    },
//                    b3:{
//                        icon:"icon ion-ios-body",
//                        ref:"home",
//                        btnName:"excercise"
//                    },
//                    b4:{
//                        icon:"icon ion-ios-game-controller-b",
//                        ref:"home",
//                        btnName:"controller"
//                    }
//                },
                row4:{   
//                    b1:{
//                        icon:"icon ion-navigate",
//                        ref:"circle",
//                        btnName:"test"
//                    },
                    b1:{
                        icon:"icon ion-briefcase",
                        ref:"demos",
                        btnName:"Demos"
                    },
//                    b2:{
//                        icon:"icon ion-ios-pulse",
//                        ref:"plot",
//                        btnName:"test"
//                    },
                    b3:{
                        icon:"icon ion-help",
                        ref:"help",
                        btnName:"Help"
                    },
                    b4:{
                        icon:"icon ion-settings",
                        ref:"settings",
                        btnName:"Connection"
                    }
                }
            };
    }])
    .controller('DemoCtrl', ['$scope', function($scope){
        $scope.apps = 
            {  
                row1:{   
                    b1:{
                        icon:"icon ion-navigate",
                        ref:"xy({demo: true})",
                        btnName:"Go Dot Demo"
                    },
                    b2:{
                        icon:"icon ion-ios-pulse",
                        ref:"trace({demo: true})",
                        btnName:"Trace Demo"
                    },
                    b3:{
                        icon:"icon ion-ios-pulse",
                        ref:"rms-time({demo: true})",
                        btnName:"RMS Plot Demo"
                    }
//                    b4: {
//                        icon:"icon ion-ios-game-controller-b",
//                        ref:"snake",
//                        btnName:"Snake Demo"
//                    }
                }
            };
    }])
    .controller('XYCtrl', ['$stateParams', '$scope', '$state', '$timeout', '$ionicPopover', 'flexvolt', 'xyDot', 'xyLogic',
    function($stateParams, $scope, $state, $timeout, $ionicPopover, flexvolt, xyDot, xyLogic) {
        
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        
        $scope.demo = $stateParams.demo;

        addPopover($ionicPopover, $scope, 'popover', 'xy-settings.html',xyLogic.updateSettings);
        addPopover($ionicPopover, $scope, 'helpover','xy-help.html');
        
        var afID;
        var frameCounts = 0;
  
        $scope.bounds = xyLogic.settings.bounds;
        
//        $scope.disp = {
//            mode : xyLogic.settings.threshMode
//        };
        
        
        // $timeout hack because the slider doesn't initialize properly
        $timeout(function(){
            $scope.thresh = xyLogic.settings.thresh;
            $scope.fakeData = xyLogic.settings.fakeData;
            $scope.plot = xyLogic.settings.plot;
            //console.log(xyLogic.settings);
            //console.log('threshMode:'+$scope.plot.thresh+', xy version:'+xyLogic.settings.plot.thresh);
        },20);
        
        $scope.onChange = function(){
            //console.log('threshMode:'+$scope.plot.thresh+', xy version:'+xyLogic.settings.plot.thresh);
            //console.log('VH:'+$scope.thresh.yH+'HH:'+$scope.thresh.xH);
            //xyLogic.updateSettings();
            console.log('INFO: Settings changed: '+JSON.stringify($scope.settings));
        };

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                frameCounts++;
                if (frameCounts > 5){
                    frameCounts = 0;
                    xyLogic.updateAnimate($stateParams.demo);
                }
            } else if ($state.current.url === '/settings'){
                afID = window.requestAnimationFrame(paintStep);
            }
        }
        
        window.onresize = function(){
            if (afID){
              window.cancelAnimationFrame(afID);
            }
            afID = undefined;
            $scope.updating  = true;
            console.log('INFO: Resize w:'+window.innerWidth+', h:'+window.innerHeight);
            xyDot.resize();
            $scope.updating  = false;
            paintStep();
        };

        xyDot.init('#xyWindow');
        paintStep();

    }])
    .controller('SnakeCtrl', ['$scope', '$state', 'xyDot', '$ionicPopover', 
    function($scope, $state, xyDot, $ionicPopover) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        
        addPopover($ionicPopover, $scope, 'popover', 'snake-settings.html');
        addPopover($ionicPopover, $scope, 'helpover','snake-help.html');
        var afID;

        var frameCounts = 0;
        var speed = 4;
        var x = 128, y = 128;
//
//        xyDot.init('#snakeWindow');

//        function updateAnimate(){
//            if ($scope.updating) return;
//        }
//
//        function paintStep(timestamp){
//            if ($state.current.url === currentUrl){
//                afID = window.requestAnimationFrame(paintStep);
//                frameCounts++;
//                if (frameCounts > 5){
//                    frameCounts = 0;
//                    updateAnimate();
//                }
//            }
//        }
//
//        paintStep();
    }])
    .controller('GameCtrl', ['$scope', '$state', '$ionicPopover', 'flexvolt',
    function($scope, $state, $ionicPopover, flexvolt) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        
        addPopover($ionicPopover, $scope, 'popover', 'game-settings.html');
        addPopover($ionicPopover, $scope, 'helpover','game-help.html');
        var afID;

        function updateAnimate(){
            if ($scope.updating) return;
            
        }

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                //console.log('repainting '+timestamp);
                updateAnimate();
            }
        }

        paintStep();
    }])

    .controller('MyometerCtrl', ['$scope', '$state', '$ionicPopover', 'flexvolt',
    function($scope, $state, $ionicPopover, flexvolt) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);

        addPopover($ionicPopover, $scope, 'popover', 'myometer-settings.html');
        addPopover($ionicPopover, $scope, 'helpover','myometer-help.html');
        var afID;

        function updateAnimate(){
            if ($scope.updating) return;
            
        }

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                //console.log('repainting '+timestamp);
                updateAnimate();
            }
        }

        paintStep();
    }])

    .controller('HRVCtrl', ['$scope', '$state', '$ionicPopover', 'flexvolt',
    function($scope, $state, $ionicPopover, flexvolt) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        
        addPopover($ionicPopover, $scope, 'popover', 'hrv-settings.html');
        addPopover($ionicPopover, $scope, 'helpover','hrv-help.html');
        
        var afID;
        

        function updateAnimate(){
            if ($scope.updating) return;
            
        }

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                //console.log('repainting '+timestamp);
                updateAnimate();
            }
        }

        paintStep();
    }])
    
    .controller('EKGCtrl', ['$scope', '$state', '$ionicPopover', 'flexvolt',
    function($scope, $state, $ionicPopover, flexvolt) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        addPopover($ionicPopover, $scope, 'popover', 'ekg-settings.html');
        addPopover($ionicPopover, $scope, 'helpover','ekg-help.html');
        
        
        var afID;
        

        function updateAnimate(){
            if ($scope.updating) return;
            
        }

        function paintStep(timestamp){
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                //console.log('repainting '+timestamp);
                updateAnimate();
            }
        }

        paintStep();
    }])

    .controller('TraceCtrl', ['$stateParams', '$scope', '$state', 'flexvolt', '$ionicPopover', 'tracePlot', 'traceLogic', 'dataHandler',
    function($stateParams, $scope, $state, flexvolt, $ionicPopover, tracePlot, traceLogic, dataHandler) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        $scope.demo = $stateParams.demo;
        var afID = undefined;
        
        addPopover($ionicPopover, $scope, 'popover', 'trace-settings.html',traceLogic.updateSettings);
        addPopover($ionicPopover, $scope, 'filterpopover', 'trace-filters.html',traceLogic.updateSettings);
        addPopover($ionicPopover, $scope, 'helpover','trace-help.html');
        
        function init() {
            dataHandler.init($scope.settings.nChannels, $scope.settings.gain);
            dataHandler.setDftFilter($scope.settings.fsFilter);
//            dataHandler.setMetrics(60);
            tracePlot.init('#traceWindow',$scope.settings.nChannels);
        }

        $scope.channelList = traceLogic.channelList;
        $scope.filterTypes = traceLogic.filterTypes;
        $scope.gainList = traceLogic.gainList;
        $scope.settings = traceLogic.settings;
        $scope.updating = false;

        $scope.onChange = function(){
            if (afID){
              window.cancelAnimationFrame(afID);
            }
            afID = undefined;
            $scope.updating  = true;
            console.log('INFO: Settings changed: '+JSON.stringify($scope.settings));
            init();
            $scope.updating  = false;
            paintStep();
        };

        function updateAnimate(){
            if ($scope.updating)return;
            
            var dataIn = dataHandler.getData();
            if (dataIn === null || dataIn === angular.undefined || 
                dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}
            tracePlot.update(dataIn);
        }

        function paintStep(timestamp){
            //console.log('state = '+$state.current.url);
            if ($state.current.url === currentUrl){
                afID = window.requestAnimationFrame(paintStep);
                updateAnimate();
            } else if ($state.current.url === '/settings'){
                afID = window.requestAnimationFrame(paintStep);
            }
        }
        
//        afID = paintStep($state, pageUrl)
//        function paintStep($state_, current, updateAnimate){
//            var afID;
//            //console.log('state = '+$state.current.url);
//            if ($state_.current.url === (current)){
//                afID = window.requestAnimationFrame(paintStep);
//                updateAnimate();
//            } else if ($state_.current.url === '/settings'){
//                afID = window.requestAnimationFrame(paintStep);
//            }
//            return afID;
//        }
        
        window.onresize = function(){ 
            if (afID){
              window.cancelAnimationFrame(afID);
            }
            afID = undefined;
            $scope.updating  = true;
            console.log('INFO: Resize w:'+window.innerWidth+', h:'+window.innerHeight);
            tracePlot.resize();
            $scope.updating  = false;
            paintStep();
        };

        init();
        paintStep();
    }])

    .controller('RMSTimeCtrl', ['$stateParams', '$scope', '$state', 'flexvolt', '$ionicPopover', 'rmsTimePlot', 'rmsTimeLogic', 'dataHandler',
    function($stateParams, $scope, $state, flexvolt, $ionicPopover, rmsTimePlot, rmsTimeLogic, dataHandler) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        
        addPopover($ionicPopover, $scope, 'popover', 'rms-time-settings.html',rmsTimeLogic.updateSettings);
        addPopover($ionicPopover, $scope, 'filterpopover', 'rms-time-filters.html',rmsTimeLogic.updateSettings);
        addPopover($ionicPopover, $scope, 'helpover','rms-time-help.html');
        
        var afID = undefined;
        var metricCounts = 0;
        
        function init(){
            dataHandler.init($scope.settings.nChannels);
            //dataHandler.setDftFilter({filterType:'HIGH_PASS', fs: 500, f1: 5, f2: 40, atten: 40, trband: 5});
            dataHandler.setDftFilter($scope.settings.fsFilter);
            dataHandler.setFilter('rmsfilter',{windowSize: $scope.settings.windowSize});
            dataHandler.setMetrics(60);
            //rmsTimePlot.setN($scope.settings.nChannels);
            rmsTimePlot.setZoomOption($scope.settings.zoomOption);
            rmsTimePlot.init('#rmsTimeWindow', $scope.settings.nChannels, flexvolt.api.settings.userFrequency);
        }

        $scope.demo = $stateParams.demo;
        $scope.channelList = rmsTimeLogic.channelList;
        $scope.zoomList = rmsTimeLogic.zoomList;
        $scope.settings = rmsTimeLogic.settings;
        $scope.filterTypes = rmsTimeLogic.filterTypes;

        $scope.updating = false;
        
//        $scope.increaseWindow = function(){
//            $scope.settings.windowSize ++;
//        };
//        
//        $scope.decreaseWindow = function(){
//            if ($scope.settings.windowSize > 0){$scope.settings.windowSize --;}
//        };

        $scope.onChange = function(){
            if (afID){
              window.cancelAnimationFrame(afID);
            }
            afID = undefined;
            $scope.updating  = true;
            console.log('INFO: Settings changed: '+JSON.stringify($scope.settings));
            init();

            $scope.updating  = false;
            paintStep();
        };

        function updateAnimate(){
            if ($scope.updating) return;
            
            metricCounts++;
            if (metricCounts > 60){
                metricCounts = 0;
                updateMetrics();
            }
            
            var dataIn = dataHandler.getData();
            
            // animate
            if (dataIn === null || dataIn === angular.undefined || 
                dataIn[0] === angular.undefined || dataIn[0].length === 0){return;}
            rmsTimePlot.update(dataIn);
        }

        function updateMetrics(){
            var metrics = dataHandler.getMetrics();
            $scope.metrics = metrics[0];
        }

        function paintStep(){
            //console.log('state = '+$state.current.url);
            if ($state.current.url === currentUrl){
                //console.log('updating');
                afID = window.requestAnimationFrame(paintStep);

                updateAnimate();

            } else if ($state.current.url === '/settings'){
                afID = window.requestAnimationFrame(paintStep);
            }
        }
        
        window.onresize = function(){ 
            if (afID){
              window.cancelAnimationFrame(afID);
            }
            afID = undefined;
            $scope.updating  = true;
            console.log('INFO: Resize w:'+window.innerWidth+', h:'+window.innerHeight);
            rmsTimePlot.resize();
            $scope.updating  = false;
            paintStep();
        };

        init();

        paintStep();
    }])

    .controller('SettingsCtrl', 
    ['$scope','$state','$timeout','$ionicModal','$ionicPopover','$ionicPopup','$http','flexvolt','appLogic',
    function($scope, $state, $timeout, $ionicModal, $ionicPopover, $ionicPopup, $http, flexvolt, appLogic) {
        var currentUrl = $state.current.url;
        console.log('currentUrl = '+currentUrl);
        //addPopover($ionicPopover, $scope, 'helpover','settings-help.html');
                
        $scope.flexvolt = flexvolt;
        $scope.con = flexvolt.api.connection;

        $scope.portList = flexvolt.getPortList;
        $scope.prefPortList = flexvolt.getPrefPortList;
        
        $scope.bugReportFields = {
            name : '',
            email : '',
            comment : ''
        };
        

        $scope.updatePorts = function(){
            flexvolt.api.updatePorts();
            // this timeout waits for the async list devices call to fill portList
            $timeout(function(){
                $scope.portList = flexvolt.getPortList;
            },500);
        };

        $scope.attemptToConnect = function(port){
            if (port !== angular.undefined){
                flexvolt.api.manualConnect(port);
            }
        };
        
        $scope.submitBugReport = function(){
            console.log('INFO: sending bugreport');
            var d = new Date();
            var month = d.getMonth()+1;
            if (month < 10) {month = '0'+month;};
            var date = d.getFullYear() + '-' + month + '-' + d.getDate();
            
            var cleanName = $scope.bugReportFields.name.replace(/[^a-z0-9.!]/gi, '');
            var cleanEmail = $scope.bugReportFields.email.replace(/[^a-z0-9.!]/gi, '');
            var cleanComment = $scope.bugReportFields.comment.replace(/[^a-z0-9.!]/gi, '');
            
            console.log('Name: '+$scope.bugReportFields.name+', cleanName: '+cleanName);
            console.log('Email: '+$scope.bugReportFields.name+', cleanEmail: '+cleanName);
            console.log('Comment: '+$scope.bugReportFields.name+', cleanComment: '+cleanName);
            
            var data = {
                date: date,
                time: d.toTimeString().slice(0,8),
                report: appLogic.dm.logs,
                browser: window.flexvoltPlatform,
                device: window.platform,
                fvmodel: flexvolt.api.connection.modelNumber !== angular.undefined?flexvolt.api.connection.modelNumber:0,
                fvserial: flexvolt.api.connection.serialNumber !== angular.undefined?flexvolt.api.connection.serialNumber:0,
                fvversion: flexvolt.api.connection.version !== angular.undefined?flexvolt.api.connection.version:0,
                name: cleanName,
                email: cleanEmail,
                comment: cleanComment
            };
            
            //window.data = data;
            
            var title = '';
            var msg = '';
            
            $http({
                method: 'POST',
                url: 'http://www.flexvoltbiosensor.com/wp-content/themes/coraline-child/bugreport.php',
                data: data,
                crossDomain : true,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            })
            .success(function (response) {
                console.log('DEBUG: bugreport response: '+JSON.stringify(response));
                if (response !== angular.undefined && response.Error){
                    msg += 'Error in bug report generator.  Try again or contact software@flexvoltbiosensor.com for help.';
                } else if (response !== angular.undefined && response.Date !== angular.undefined 
                        && response.Date === data.date && response.Time !== angular.undefined && response.Time === data.time) {
                    msg += 'Successfully Submited a Bug Report.  Thank you for taking the time to help make the app better!';
                } else {
                    msg += 'Unknown error encountered during bug report upload.  Try again or contact software@flexvoltbiosensor.com for help.';
                }
                
            })
            .catch(function (err){
                console.log('ERROR: Failed connection to bugreport server: '+JSON.stringify(err));
                msg += 'Bug Report Submission Failed To Connect to Server. Try again or contact software@flexvoltbiosensor.com for help.';
            })
            .finally(function(){
                $scope.bugmodal.hide();
                $ionicPopup.alert({
                  title: 'Bug Report Submission',
                  template: msg
                });
                
            });
            
            
            
            
//        $scope.copyToClipboard = function(){
//            clipboard.copy(appLogic.dm.logs);
//            $ionicPopup.alert({
//                title: 'Software Logs Copied',
//                template: 'Now open your email client, paste the logs in an email (usually press and hold in the message section, then choose paste), and send to software@flexvoltbiosensor.com'
//            });
//        };
        
        //$scope.emailBugReport = 'mailto:bugreports@flexvoltbiosensor.com?subject=inApp%20Bug%20Report&body='+appLogic.dm.logs;
//            var cr = '%0D%0A';
//            //clipboard.copy(appLogic.dm.logs);
//            var tmpLogs = appLogic.dm.logs.replace(/(?:\r\n|\r|\n)/g, '%0D%0A');
//            var bodyStart = 'Bug Description:  '+cr+cr+'Log Messages:'+cr;
//            var emailBugReport = 'mailto:bugreports@flexvoltbiosensor.com?subject=inApp%20Bug%20Report&body='+bodyStart+tmpLogs;
//            window.open(emailBugReport);
        };
        
//        $scope.sendEmail2 = function(){
//            var cr = '%0D%0A';
//            var tmpLogs = appLogic.dm.logs.replace(/(?:\r\n|\r|\n)/g, '%0D%0A');
//            var bodyStart = 'Bug Description:  '+cr+cr+'Log Messages:'+cr;
//            var body = bodyStart+tmpLogs;
//            var url = 'php/sendBugReport2.php';
//            $http.post(url)
//            .success(function(data,status){
//                console.log('INFO: Success emailing.  status = '+status);
//                console.log(data);
//            })
//            .error(function(data, status){
//                console.log('INFO: Error emailing.  status = '+status);
//                console.log(data);
//            });
//        };
        
        // email plugin didn't work
//        console.log('email:');
//        console.log(email);
//        window.email = email;
//        $scope.sendBugReport = function(){
//            console.log('trying to send bug report');
//            email.isAvailable(function(res){
//                console.log('res = '+res);
//                if (res){
//                    console.log('opening email');
//                    email.open({
//                        to: 'info@flexvoltbiosensor.com',
//                        subject: 'bugreport',
//                        body: 'hello'//appLogic.dm.logs
//                    });
//                } else {
//                    console.log('email not available');
//                }
//            });
//        };



        $scope.dm = appLogic.dm;
        
        $ionicModal.fromTemplateUrl('templates/modal.html', {
            scope: $scope
        }).then(function(modal){
            $scope.modal = modal;
        });

        $scope.showLog = function(){
            $scope.modal.show();
        };
        
        
        $ionicModal.fromTemplateUrl('templates/bugreport.html', {
            scope: $scope
        }).then(function(modal){
            $scope.bugmodal = modal;
        });

        $scope.showBugReportForm = function(){
            $scope.bugmodal.show();
        };

    //    var stop = $interval(function(){
    //        flexvolt.api.updatePorts();
    //    },500);
    //    
    //    $scope.clearLog = function(){
    //        flexvolt.api.debugging.communicationsLog = '';
    //    };
    //    
    }])
    .controller('IntroCtrl', ['$scope', function($scope){
//        $scope.emailTaskFeedback = 'mailto:software@flexvoltbiosensor.com?subject=inApp%20Task%20Feedback';
        
        // send email to software, with subject 'inApp Task Feedback'
//        $scope.sendEmail = function(){
//            var cr = '%0D%0A';
//            var bodyStart = 'Task Name: '+cr+'Feedback:'+cr+cr+'OR'+cr+cr+'New task request:';
//            var emailTaskFeedback = 'mailto:software@flexvoltbiosensor.com?subject=inApp%20Task%20Feedback&body='+bodyStart;
//            window.open(emailTaskFeedback);
//        };
    }])
    .controller('MainCtrl', ['$scope', 'flexvolt', 'appLogic', 'storage',
    function($scope, flexvolt, appLogic, storage) {
        // high level container for app-wide functions/variables
        $scope.mobile = false;
        $scope.flexvolt=flexvolt;
        if (window.cordova) {$scope.mobile = true;}
        console.log('mobile = '+$scope.mobile);
    }]);
}());
