var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser')
var logger = require('morgan');
var mongoose = require('mongoose')
var cookieSession = require('cookie-session')
var passport = require('passport')

var passportSetup = require('./config/passport-setup')
var keys = require('./config/keys')
mongoose.connect(keys.mongodb.dbURI,
    { useNewUrlParser: true }
    ).then(function(){
      console.log('DB Connected')}
    ).catch(function(){
      console.log('DB Error')
});

var Prize = require('./models/prize')
var User = require('./models/user')
var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var prizeRouter = require('./routes/prizes');
var devRouter = require('./routes/dev');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [keys.session.cookieKey]
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/prizes', prizeRouter);
app.use('/dev', devRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
