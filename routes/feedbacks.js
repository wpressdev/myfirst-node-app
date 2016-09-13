var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var md5 = require('MD5');
var dateFormat = require('dateformat');
var now = new Date();

router.get('/', function(req, res, next) {
if(res.locals.loggedinUser)
{
  //var userId = res.locals.loggedinUser;
  // Displaying feedbacks
  global.objConn.query("SELECT * FROM feedback ORDER BY feedbackId DESC", function(err, feedbacks) {
  	if(err)
          throw err;
    res.render('feedbacks', {title: 'Feedbacks', feedbacks: feedbacks});
  });
}
else
{
  res.render('signin', {title: 'Signin'});
}
});

module.exports = router;
