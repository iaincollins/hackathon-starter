/**
 * Module dependencies.
 */

var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var methodOverride = require('method-override');
var _ = require('lodash');
var MongoStore = require('connect-mongo')({ session: session });
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');
var ejs = require('ejs');
var partials = require('express-partials');
var app = express();

/**
 * API keys and Passport configuration.
 */
var config = {
  app: require('./config/app'),
  secrets: require('./config/secrets'),
  secrets: require('./config/secrets')
};

/**
 * Connect to MongoDB.
 */
mongoose.connect(config.secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

/**
 * CSRF whitelist.
 */
var csrfExclude = [];

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', ejs.__express);
partials.register('.ejs', ejs);
app.use(partials());
app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')],
  helperContext: app.locals
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.secrets.sessionSecret,
  store: new MongoStore({
    url: config.secrets.db,
    auto_reconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  // CSRF protection.
  if (_.contains(csrfExclude, req.path)) return next();
  csrf(req, res, next);
});
app.use(function(req, res, next) {

  res.locals.siteName = config.app.name;
  res.locals.title = config.app.name;

  // Make user object available in templates.  
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  // Remember original destination before login.
  var path = req.path.split('/')[1];
  if (/auth|login|logout|signup|fonts|favicon/i.test(path)) {
    return next();
  }
  req.session.returnTo = req.path;
  next();
});

var hour = 3600000;
var day = hour * 24;
var week = day * 7;
app.use(express.static(path.join(__dirname, 'public'), { maxAge: week * 4 }));

/**
 * Route handlers
 */
var routes = {
  home: require('./routes/home'),
  about: require('./routes/about'),
  contact : require('./routes/contact'),
  user: require('./routes/user'),
  passport: require('./routes/passport')
};

app.use(function(req, res, next) {
  // Open up calls to cross site origin requests
  // res.setHeader("Access-Control-Allow-Origin", "*");
  // Specify which headers and methods can be set by the client
  // Explicitly required for compatiblity with many browser based REST clients
  // res.setHeader("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,Session-Id,Api-Key");
  // res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS,PUT,DELETE");
  
  if (req.method == "OPTIONS") {
      // Return immediately for all OPTIONS requests
      res.send();
  } else {
      next();    
  }
});

/**
 * Main routes.
 */
app.get('/', routes.home.index);
app.get('/about', routes.about.index);
app.get('/login', routes.user.getLogin);
app.post('/login', routes.user.postLogin);
app.get('/logout', routes.user.logout);
app.get('/reset-password', routes.user.getResetPassword);
app.post('/reset-password', routes.user.postResetPassword);
app.get('/change-password/:token', routes.user.getChangePassword);
app.post('/change-password/:token', routes.user.postChangePassword);
app.get('/signup', routes.user.getSignup);
app.post('/signup', routes.user.postSignup);
app.get('/contact', routes.contact.getContact);
app.post('/contact', routes.contact.postContact);
app.get('/account', routes.passport.isAuthenticated, routes.user.getAccount);
app.post('/account/profile', routes.passport.isAuthenticated, routes.user.postUpdateProfile);
app.post('/account/password', routes.passport.isAuthenticated, routes.user.postUpdatePassword);
app.post('/account/delete', routes.passport.isAuthenticated, routes.user.postDeleteAccount);
app.get('/account/unlink/:provider', routes.passport.isAuthenticated, routes.user.getOauthUnlink);

/**
 * OAuth sign-in routes.
 */
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function(req, res) {
  res.redirect(req.session.returnTo || '/');
});

/**
 * 500 Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;