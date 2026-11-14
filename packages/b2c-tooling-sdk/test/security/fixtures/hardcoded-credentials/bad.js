'use strict';

var HTTPClient = require('dw/net/HTTPClient');

var API_KEY = 'sk_live_51HxQ2eKz8Y3'; // expect

var config = {
  endpoint: 'https://api.example.com',
  clientSecret: 'a9F3kL0pQ7zX2mN8', // expect
};

function call() {
  var client = new HTTPClient();
  client.open('GET', 'https://api.example.com/orders', 'svc-user', 'S3cr3tPassw0rd'); // expect
  client.setRequestHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9abc'); // expect
  client.setRequestHeader('X-Api-Key', 'k-8a7d6f5e4c3b2a1'); // expect
  client.send();
}

function setPassword(service) {
  service.password = 'Passw0rd!2024'; // expect
}

module.exports = {API_KEY: API_KEY, config: config, call: call, setPassword: setPassword};
