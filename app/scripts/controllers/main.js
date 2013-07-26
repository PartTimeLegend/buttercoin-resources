'use strict';

angular.module('buttercoinResourcesApp')
  .controller('MainCtrl', function ($scope, AccountsResource) {
    $scope.accounts = [];
    
    AccountsResource.get('me', function(data) {
      $scope.accounts.push(data);
    });

  });
