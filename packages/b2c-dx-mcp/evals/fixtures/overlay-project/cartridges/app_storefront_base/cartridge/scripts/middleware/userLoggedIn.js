'use strict';

function validateLoggedInAjax(req, res, next) {
    if (!req.currentCustomer.profile) {
        res.setStatusCode(401);
        res.json({error: 'login required'});
    }
    next();
}

module.exports = {validateLoggedInAjax: validateLoggedInAjax};
