/***
 *
 * This service is a Generic service for accessing IFG API resources
 *
 */
'use strict';
angular.module('buttercoin.resource', ['buttercoin.api', 'bc-config'])
.constant('ButtercoinApiBaseUri', '')
.factory('ButtercoinResource', function(ButtercoinApiBaseUri, ButtercoinApi, settings) {

  var get,
      save,
      getMulti,
      getAll;
  
  // TODO: Make settings configurable
  ButtercoinApi.config(settings.OAUTH_api_endpoint, settings.OAUTH_callback_url,settings.OAUTH_app_id);
  //ButtercoinApi.config("http://localhost:3000/dialog/authorize", "http://localhost:3000", "aasdlfkjhasdf");

  getAll = function(resourceName, success, error) {
    success = typeof success === 'function' ? success : function () {};
    error = typeof error === 'function' ? error : function () {};

    // TODO: Expose paging support somehow
    var resourceUri = ButtercoinApiBaseUri + resourceName;
    ButtercoinApi.get(resourceUri, function(data) {

      var errorState = false;
      var resourceSummary = [];

      if (data.data)
      {
        resourceSummary = data.data;
      }
      else
      {
        errorState = true;
      }

      if (errorState)
      {
        error();
      }
      else
      {
        success(resourceSummary);
      }
    }, error);
  };

  get = function(resourceName, id, success, error) {
    success = typeof success === 'function' ? success : function () {};
    error = typeof error === 'function' ? error : function () {};

    var resourceDetails;
    var resourceUri = ButtercoinApiBaseUri + resourceName + '/' + id;
    ButtercoinApi.get(resourceUri, function(data) {

      var errorState = false;

      if (data.data)
      {
        resourceDetails = data.data;
      }
      else
      {
        errorState = true;
      }

      if (errorState)
      {
        error();
      }
      else
      {
        success(resourceDetails);
      }

    }, error);
  };

  getMulti = function(resourceName, ids, success, error) {
    success = typeof success === 'function' ? success : function () {};
    error = typeof error === 'function' ? error : function () {};
    ids = typeof ids === 'Array' ? ids : [];

    var resourceDetails = {};
    var apiSuccess = function (data) {
      resourceDetails = data.data.details;
      for( var key in data.data.summary) {
        resourceDetails[key] = data.data.summary[key];
      }
      success(resourceDetails);
    };
    var resourceUri = '';

    // TODO (dali) : Use Async to fire all these calls in parallel
    for (var id in ids) {
      resourceUri = ButtercoinApiBaseUri + resourceName + '/' + id + '?format=json';
      ButtercoinApi.get(resourceUri, apiSuccess, error);
    }
  };
  return {
    getAll: getAll,
    getMulti: getMulti,
    get: get,
    save: save
  };
})

.factory('ButtercoinCachableResource', function(ButtercoinResource) {
  var resources = resources || {}, // Local cache
      resourceDetails = resourceDetails || {}, // Local cache
      getResources,
      getResourceDetails,
      get,
      save,
      getMulti,
      getAll,
      clearCache;

  getResources = function() {
    return resources;
  };

  getResourceDetails = function() {
    return resourceDetails;
  };

  getAll = function (resourceName, success, error) {
    success = typeof success === 'function' ? success : function () {};
    error = typeof error === 'function' ? error : function () {};

    // TODO(Dali) : Expose paging support somehow

    // Check the local cache here
    if (resources[resourceName] && resources[resourceName].length > 0)
    {
      success(resources[resourceName]);
      return;
    }
    else
    {
      resources[resourceName] = {};
    }

    ButtercoinResource.getAll(resourceName, function (data) {
      // set the local cache here
      resources[resourceName] = data;
      success(resources[resourceName]);
    }, error);
  };

  get = function (resourceName, id, success, error) {
    success = typeof success === 'function' ? success : function () {};
    error = typeof error === 'function' ? error : function () {};

    // Check the local cache here
    if (resourceDetails[resourceName] && resourceDetails[resourceName][id])
    {
      success(resourceDetails[resourceName][id]);
      return;
    }
    else
    {
      resourceDetails[resourceName] = {};
    }

    ButtercoinResource.get(resourceName, id, function(data) {
      // set the local cache here
      resourceDetails[resourceName][id] = data;
      success(resourceDetails[resourceName][id]);
    }, error);
  };

  getMulti = function (resourceName, ids, success, error) {
    success = typeof success === 'function' ? success : function () {};
    error = typeof error === 'function' ? error : function () {};
    ids = typeof ids === 'Array' ? ids : [];

    var resourceDetailsResp = {}; // Multi-id query result

    var apiSuccess = function(data) {
      // set the local cache here
      resourceDetails[resourceName][id] = data;
      // Prepare the response from the cached value
      resourceDetailsResp[id] = resourceDetails[resourceName][id];
    };

    for (var id in ids) {
      // Check the local cache here
      if (resourceDetails[resourceName] && resourceDetails[resourceName][id])
      {
        resourceDetailsResp[id] = resourceDetails[resourceName][id];
        continue;
      }
      else
      {
        ButtercoinResource.get(resourceName, id, apiSuccess, error);
      }

    }
    success(resourceDetailsResp);
  };

  save = function (resourceName, data, success, error) {
    success = typeof success === 'function' ? success : function () {};
    error = typeof error === 'function' ? error : function () {};

    var id;

    // Check the local cache here
    if (resourceDetails[resourceName] && resourceDetails[resourceName][id]) {
      resourceDetails[resourceName][id] = {};
      return;
    }
    else
    {
      resourceDetails[resourceName] = {};
    }

    ButtercoinResource.save(resourceName, data,function(saveResponse) {
      // set the local cache here
      success(saveResponse);
      ButtercoinResource.get(resourceName, saveResponse.id , function(){}, error);
    }, error);
  };

  clearCache = function (resourceName) {
    delete resourceDetails[resourceName];
  };

  return {
    getCache: getResources,
    getDetailedCache: getResourceDetails,
    getAll: getAll,
    getMulti: getMulti,
    get: get,
    save: save,
    clearCache: clearCache
  };
});
