var http = require('http'),
    express = require("express"),
    path = require("path"),
    favicon = require("serve-favicon"),
    mysql = require("mysql"),
    logger = require("morgan"),
    cookieParser = require("cookie-parser"),
    bodyParser = require("body-parser"),
    passwordHash = require('password-hash'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    expressSession = require('express-session'),
    md5 = require('MD5'),
    dateFormat = require("dateformat"),
    now = new Date(),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    flash = require('connect-flash');
    
var environment = process.env.ENVIRONMENT || "production",
    IP_HOST = process.env.IP_HOST,
    USER_ID = process.env.USER_ID,
    USER_KEY = process.env.USER_KEY,
    USER_DB = process.env.USER_DB,
    AUTH_USERNAME = process.env.AUTH_USERNAME,
    AUTH_PASSWORD = process.env.AUTH_PASSWORD,
    TO_EMAIL = process.env.TO_EMAIL;
    
var routes = require('./routes/index');
var signin = require('./routes/signin');
var feedbacks = require('./routes/feedbacks');

// Database connection
objConn = mysql.createConnection({
        host     : IP_HOST,
        user     : USER_ID,
        password : USER_KEY,
        database : USER_DB
    });
    
var app = express();

// Trusting Openshift proxy
app.enable('trust proxy');

app.set("env", environment);
app.set("logger", logger);

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressSession({
  secret: 'testCat',
  resave: true,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// User login
passport.use('local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        //passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(email, password, done) { // callback with email and password from our form
        objConn.query("SELECT * FROM users WHERE email = ? LIMIT 1;", [email], function (err, user, fields) {
            if(err){
                var errmessage = 'Username or password incorrect';
                return done(null, false, { message: errmessage });
            }else{
                if(user.length == 0){
                    return done(null, false, { message: errmessage });
                }else{
                      if(md5(password)==user[0].password){
                        expressSession = user[0].email;   // Setting session variable
                        return done(null, user);
                    }else{
                        return done(null, false, { message: errmessage });
                    }
                }
            }
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// Submitting feedback
app.post("/", function (req, res) {
    var feedback_date = dateFormat(now, "yyyy-mm-dd hh:MM:ss");
    var emailBody = 'Hello, <br><br> A new user has given the feedback. Following are the feedback information:<br><br><br>' +
                    'Name: ' + req.body.firstname+ ' ' +req.body.lastname + 
                    '<br><br> Email: ' + req.body.email + 
                    '<br><br> Options: ' + req.body.options + 
                    '<br><br> Satisfaction Level: ' + req.body.satisfaction + 
                    '<br><br> Comments: <br>' + req.body.comments + 
                    '<br><br> Date: ' + feedback_date + '<br><br><br><br>' +
                    '<br> Regards,<br><br>Admin<br>';

    objConn.query("INSERT INTO feedback (firstName,lastName,email,options,satisfaction_level,comments,feedback_date) VALUES (?,?,?,?,?,?,?)", [req.body.firstname,req.body.lastname,req.body.email,req.body.options,req.body.satisfaction,req.body.comments,feedback_date], function (err, content, fields) {
            if(err){
                if(err.code !== "ER_DUP_ENTRY"){
                    console.log(err);
                }
            }else{
                console.log(emailBody);
                // create reusable transporter object using the default SMTP transport
                var options = {
                    host: 'smtp.gmail.com', // hostname 
                    secureConnection: true, // use SSL    
                    service: 'gmail',
                    auth: {
                        user: AUTH_USERNAME,
                        pass: AUTH_PASSWORD
                    }
                  };
                  var transporter = nodemailer.createTransport(smtpTransport(options));

                  // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: req.body.email,
                    to: TO_EMAIL,
                    subject: 'User feedback',
                    html: emailBody
                };

                //var msg = 'Thank you for your feedback';
                // send mail with defined transport object
                transporter.sendMail(mailOptions, function(error, res){
                    if(error){
                        console.log(error);
                    }else{
                        console.log("Message sent: " + msg);
                    }
                    //smtpTransport.close(); // shut down the connection pool, no more messages
                });
                //logger.info("Thank you for your feedback!");
                res.redirect("/");
            }
        });
    });

app.get('/signin', function(req, res){
  res.render('signin', { title: 'Signin', message: req.flash('signinMessage') });
});

// Setting up the session variables
app.all('*', function (req, res, next) {
  if(req.user){
    res.locals.loggedinUser = true;
    res.locals.loggedinUser = expressSession;
  }
  next();
});

// Sign out
app.get('/signout', function(req, res){
  req.session.destroy();
  req.logout();
  res.redirect('/signin');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
});
app.get('/', function(request, response) {
  response.render('./routes/index');
});
app.get('/signin', function(request, response) {
  response.render('./routes/signin');
});
app.get('/feedbacks', function(request, response) {
  response.render('./routes/feedbacks');
});


// Error Handlers

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


