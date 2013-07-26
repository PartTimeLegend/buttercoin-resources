'use strict';

angular.module('buttercoin.api', ['buttercoin.authenticator'])
.factory('ButtercoinApi', function (ButtercoinApiAuthenticator, $http) {
  var config,
      get,
      post;
  config = function (hostOauth,redirectUri,clientId) {
    ButtercoinApiAuthenticator.config(hostOauth, redirectUri, clientId);
  };

  get = function(resource, success, error) {
    var url = ButtercoinApiAuthenticator.getHost() + resource;
    success = typeof success === 'function' ? success : function () {};
    error = typeof error === 'function' ? error : function () {};

    ButtercoinApiAuthenticator.getToken(function() {
      $http.get(url)
      .success(success)
      .error(function(data, status, headers, config) {
        if(status === 401) {
          ButtercoinApiAuthenticator.revokeToken();
          get(resource, success);
        }
        error(data, status, headers, config);
      });
    });
  };
  post = function(resource, data,success, error) {
    var url = ButtercoinApiAuthenticator.getHost() + resource;
    success = typeof success === 'function' ? success : function () {};
    error = typeof error === 'function' ? error : function () {};

    ButtercoinApiAuthenticator.getToken(function() {
      $http.post(url, data)
      .success(success)
      .error(function(dataErr, status, headers, config) {
        if(status === 401) {
          ButtercoinApiAuthenticator.revokeToken();
          post(resource, data, success);
        }
        error(dataErr, status, headers, config);
      });
    });
  };
  return {
    config: config,
    get: get,
    post: post
  };
});

