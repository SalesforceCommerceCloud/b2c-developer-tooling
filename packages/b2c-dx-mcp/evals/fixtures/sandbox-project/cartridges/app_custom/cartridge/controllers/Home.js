'use strict';

var server = require('server');

server.get('Show', function (req, res, next) {
    res.render('home/homePage');
    next();
});

module.exports = server.exports();
