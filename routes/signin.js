var express = require('express');
var router = express.Router();
var passport = require('passport');
var squel = require("squel");

router.get("/", function (req, res, next) {
    res.render('signin', {title: 'Signin'});
});

router.post('/', passport.authenticate('local'), function (req, res){
    res.redirect('/feedbacks');
});

module.exports = router;
