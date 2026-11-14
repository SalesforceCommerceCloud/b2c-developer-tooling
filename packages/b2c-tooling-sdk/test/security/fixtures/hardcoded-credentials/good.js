'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');

var API_KEY_PREFERENCE = 'paymentApiKey';
var passwordField = 'dwfrm_login_password';

var settings = {
  apiKey: Site.current.getCustomPreferenceValue(API_KEY_PREFERENCE),
  password: '',
  secret: '********',
  clientSecret: 'payment.clientSecret',
};

var service = LocalServiceRegistry.createService('payment.http', {
  createRequest: function (svc, args) {
    var credential = svc.configuration.credential;
    svc.addHeader(
      'Authorization',
      'Basic ' + require('dw/util/StringUtils').encodeBase64(credential.user + ':' + credential.password),
    );
    return args;
  },
});

function call(client, token) {
  client.open('GET', 'https://api.example.com/orders');
  client.setRequestHeader('Authorization', 'Bearer ' + token);
}

module.exports = {settings: settings, service: service, call: call, passwordField: passwordField};
