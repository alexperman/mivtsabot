var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');
var logger = require('morgan');

var index = require('./routes/index');
//var payload = require('./routes/payload');
//var webview = require('./routes/webview');
//var catalog = require('./routes/catalog');

var flutterflow = require('./routes/flutterflow');

var expressValidator = require('express-validator');

const FirebaseAdmin = require('./middlewares/firebase-admin');
const firebase_admin = new FirebaseAdmin();
firebase_admin.initListeners();

var app = express();
global.appRoot = path.resolve(__dirname);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: "secretpass123456",
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(expressValidator());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
//app.use('/payload', payload);
//app.use('/webview', webview);
//app.use('/catalog', catalog);
app.use('/flutterflow', flutterflow);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
