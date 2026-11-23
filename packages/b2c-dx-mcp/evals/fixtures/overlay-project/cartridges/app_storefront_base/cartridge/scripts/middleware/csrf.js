'use strict';

var CSRFProtection = require('dw/web/CSRFProtection');

function validateAjaxRequest(req, res, next) {
    if (!CSRFProtection.validateRequest()) {
        res.setStatusCode(403);
        res.json({error: 'CSRF token mismatch'});
    }
    next();
}

module.exports = {validateAjaxRequest: validateAjaxRequest};
