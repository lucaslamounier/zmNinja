/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,moment */

// This controller generates a graph for events
// the main function is generateChart. I call generate chart with required parameters
// from the template file

angular.module('zmApp.controllers').controller('zmApp.EventsGraphsCtrl', ['$ionicPlatform', '$scope', 'ZMDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', function ($ionicPlatform, $scope, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http) {
    console.log("Inside Graphs controller");
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$ionicView.loaded', function () {
        console.log("**VIEW ** Graph Ctrl Loaded");
    });

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** EventsGraphs Ctrl Entered");
        ZMDataModel.setAwake(false);
    });

    $scope.$on('$ionicView.leave', function () {
        console.log("**VIEW ** Graph Ctrl Left");
    });

    $scope.$on('$ionicView.unloaded', function () {
        console.log("**VIEW ** Graph Ctrl Unloaded");
    });


    //-------------------------------------------------
    // Controller main
    //-------------------------------------------------

   // $scope.chart = "";
    $scope.navTitle = 'Tab Page';
    // $scope.chart="";
    $scope.leftButtons = [{
        type: 'button-icon icon ion-navicon',
        tap: function (e) {
            $scope.toggleMenu();
        }
        }];



    // -------------------------------------------------
    // Called when user taps on a bar
    //---------------------------------------------------
    $scope.handleChartClick = function (event) {

        console.log (JSON.stringify( $scope.chartwithbars.getBarsAtEvent(event)));
        //console.log(angular.element[0].getContext('2d'));
        //console.log (JSON.stringify( $scope.chart));

    };

    //-------------------------------------------------
    // Generates a bar graph with data provided
    //-------------------------------------------------
    $scope.generateTCChart = function (id, chartTitle, hrs) {
        var monitors = [];
        var dateRange = "";
        var startDate = "";
        var endDate = "";

        $scope.chart = {
            barHeight:"",
            data:"",
            options:""

        };


        $scope.chart.barHeight = $rootScope.devHeight;


        if (hrs) {
            // Apply a time based filter if I am not watching all events
            var cur = moment();
            endDate = cur.format("YYYY-MM-DD hh:mm:ss");
            startDate = cur.subtract(hrs, 'hours').format("YYYY-MM-DD hh:mm:ss");
            console.log("Start and End " + startDate + "==" + endDate);
            ZMDataModel.zmLog("Generating graph for " + startDate + " to " + endDate);

        }

        var loginData = ZMDataModel.getLogin();
        //$scope.chart.data = {};
        $scope.chart.data = {
            labels: [],
            datasets: [
                {
                    label: '',
                    fillColor: 'rgba(151,187,205,0.5)',
                    strokeColor: 'rgba(151,187,205,0.8)',
                    highlightFill: 'rgba(0,163,124,0.5)',
                    //   highlightFill: 'rgba(151,187,205,0.75)',
                    // highlightStroke: 'rgba(151,187,205,1)',
                    data: []
        },
          ]};

        ZMDataModel.getMonitors(0).then(function (data) {
            monitors = data;
            var adjustedHeight = monitors.length * 30;
            if (adjustedHeight > $rootScope.devHeight) {

                $scope.chart.barHeight = adjustedHeight;
                console.log("********* BAR HEIGHT TO " + $scope.chart.barHeight);
            }

            for (var i = 0; i < monitors.length; i++) {
                (function (j) { // loop closure - http is async, so success returns after i goes out of scope
                    // so we need to bind j to i when http returns so its not out of scope. Gak.
                    // I much prefer the old days of passing context data from request to response

                    $scope.chart.data.labels.push(monitors[j].Monitor.Name);

                    //$scope.chartObject[id].data.push([monitors[j].Monitor.Name,'0','color:#76A7FA','0']);
                    // $scope.chartObject.data[j+1]=([monitors[j].Monitor.Name,'100','color:#76A7FA','0']);

                    var dateString = "";
                    if (hrs) {
                        dateString = "/StartTime >=:" + startDate + "/EndTime <=:" + endDate;
                    }
                    var url = loginData.apiurl +
                        "/events/index/MonitorId:" + monitors[j].Monitor.Id + dateString +
                        ".json?page=1";
                    // console.log("Monitor event URL:" + url);

                    $http.get(url /*,{timeout:15000}*/ )
                        .success(function (data) {
                            console.log("**** EVENT COUNT FOR MONITOR " +
                                monitors[j].Monitor.Id + " IS " + data.pagination.count);
                            $scope.chart.data.datasets[0].data[j] = data.pagination.count;
                        })
                        .error(function (data) {
                            // ideally I should be treating it as an error
                            // but what I am really doing now is treating it like no events
                            // works but TBD: make this into a proper error handler
                            $scope.chart.data.datasets[0].data[j] = 0;
                            ZMDataModel.zmLog ("Error retrieving events for graph " + JSON.stringify(data), "error");
                        });
                })(i); // j
            } //for
        });

        $scope.chart.options = {

            responsive: true,
            scaleBeginAtZero: true,
            scaleShowGridLines: false,
            scaleGridLineColor: "rgba(0,0,0,.05)",
            scaleGridLineWidth: 1,
            barShowStroke: true,
            barStrokeWidth: 2,
            barValueSpacing: 5,
            barDatasetSpacing: 1,
            showTooltip: true,

            //String - A legend template
            //  legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
        };
    }; //generateTCChart
}]);

