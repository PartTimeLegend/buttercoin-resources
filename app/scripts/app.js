'use strict';

var depedencies = [
  'buttercoin.accounts'
];

angular.module('buttercoinResourcesApp', dependencies)
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
