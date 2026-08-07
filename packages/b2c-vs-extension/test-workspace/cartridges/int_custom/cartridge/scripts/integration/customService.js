'use strict';

/**
 * Custom integration service
 */

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * Initialize custom service
 * @returns {dw.svc.Service} Service instance
 */
function getService() {
  return LocalServiceRegistry.createService('custom.http.service', {
    createRequest: function (svc, params) {
      svc.setRequestMethod('GET');
      return params;
    },
    parseResponse: function (svc, httpClient) {
      return JSON.parse(httpClient.text);
    },
  });
}

module.exports = {
  getService: getService,
};
