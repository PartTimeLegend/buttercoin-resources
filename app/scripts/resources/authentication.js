'use strict';

/* global angular */
angular.module('buttercoin.authenticator', [])
.factory('ButtercoinApiAuthenticator', function($http) {

  var token,
    getToken,
    getHost,
    getHostOauth,
    revokeToken,
    createLightBox,
    requestToken,
    settings,
    logout,
    config,
    http = $http,
    tokenCallbacks = [],
    logoutCallback;

  var tokenRequestMutex = true,
      callbacksQueue = [];

  getToken = function(callback) {

    // If we have a token, return the token
    if(token !== undefined) {
      callback(token);
      return;
    }

    // If we don't have a token, we use the mutex to request a token
    if (tokenRequestMutex)
    {
      tokenRequestMutex = false;
      requestToken(callback);
    }
    // If mutex is not available, we wait in a queue
    else
    {
      callbacksQueue.push(callback);
    }

  };

  requestToken = function(callback) {

    var pathOauth = 'dialog/authorize',
        responseType = 'token',
        url;

    // Pass directly url in the iframe
    url = settings.hostOauth +
          pathOauth +
          '?' +
          'client_id=' +
          encodeURIComponent(settings.clientId) +
          '&redirect_uri=' +
          encodeURIComponent(settings.redirectUri) +
          '&response_type=' +
          encodeURIComponent(responseType);

    tokenCallbacks.push(callback);
    console.log("url", url);
    // Load the lightbox in the dom
    createLightBox(url);
  };

  createLightBox = function (url) {
    var htmlTemplate =  '<div id="login-modal" class="modal fade">' +
                          '<style> ' +
                            '.modal { width:417px; height:563px; margin-top:-71px; margin-left:-208px; z-index:99999;} ' +
                            '.modal-body { max-height: none; padding:0px; }' +
                          '</style>' +
                          '<div class="modal-body">' +
                            '<iframe src="' + url + '" style="width:417px; height:558px; border:none;"></iframe>' +
                          '</div>' +
                        '</div>';

    angular.element(document.body).append(htmlTemplate);
    $('#login-modal').modal({
      backdrop: true
    });
    $('#login-modal').on('hidden', function () {
      // On modal hide
      $('#login-modal').remove();


      // We revoke the token, clear the cache and call the logoutCallback
      if (typeof logoutCallback !== 'undefined')
      {
        token = undefined;
        delete http.defaults.headers.common.AUTHORIZATION;
        logoutCallback();
        logoutCallback = undefined;
      }

      // We free the mutex and clear the callbacks
      tokenRequestMutex = true;
      tokenCallbacks = [];
      callbacksQueue = [];
    });
  };

  config = function (hostOauth, redirectUri, clientId) {
    settings = {
      hostOauth: hostOauth,
      redirectUri: redirectUri,
      clientId: clientId
    };
  };

  revokeToken = function() {
    token = undefined;
  };

  logout = function (success, error) {
    var url = getHostOauth() + 'logout';
    success = typeof success === 'function' ? success : function () {};
    error = typeof error === 'function' ? error : function () {};

    if (typeof token === 'undefined')
    {
      error();
    }

    var body = 'token=' + encodeURIComponent(token) + '&token_type_hint=access_token&logout_url=true';

    $http.post(url, body, {
      headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    })
    .success(function (json) {
      token = undefined;
      var logoutUrl = json.logout_url;
      logoutUrl += '?redirect_uri=' + settings.redirectUri;
      logoutCallback = success;
      createLightBox(logoutUrl);
    })
    .error(function(data, status, headers, config) {
      error(data, status, headers, config);
    });
  };

  var eventFunction = function (e) {

    // Parsing message from the lightbox
    var data = JSON.parse(e.data),
        callback,
        accessTokenKey = 'access_token';

    // Closing the lightbox
    setTimeout(function() {
      $('#login-modal').modal('hide');
    }, data.logout ? 1000 : 2000);


    // If we are logging out we can stop there
    if (data.logout)
    {
      return;
    }

    // If we was getting a token, we store it and set
    // the http default header with the new AUTHORIZATION header
    token = data[accessTokenKey];
    http.defaults.headers.common.AUTHORIZATION = 'Bearer ' + token;


    // If no token callback waiting, we can stop here
    if(tokenCallbacks.length <= 0) {
      return false;
    }


    callback = tokenCallbacks.pop();

    if(typeof callback === 'function') {
      callback(token);
    }

    // Token is here, we free the mutex
    tokenRequestMutex = true;
    // We empty the queue and return tokens
    while (callbacksQueue.length > 0)
    {
      callback = callbacksQueue.pop();

      if(typeof callback === 'function') {
        callback(token);
      }
    }

  };


  // All browsers compatibility
  var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
  var eventer = window[eventMethod];
  var messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

  eventer(messageEvent, eventFunction, false);

  getHostOauth = getHost = function() {
    return settings.hostOauth;
  };


  return {
    config: config,
    getToken: getToken,
    getHost: getHost,
    getHostOauth: getHostOauth,
    revokeToken: revokeToken,
    logout: logout,

    retrieveToken: function() {
      return token;
    }
  };
});
