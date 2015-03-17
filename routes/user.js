var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');
var config = {
  app: require('../config/app')
};

/**
 * GET /login
 * Login page.
 */
exports.getLogin = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/login', { title: res.locals.title + " - Login" });
};

/**
 * POST /login
 * Sign in using email and password.
 * @param email
 * @param password
 */
exports.postLogin = function(req, res, next) {
  req.assert('email', 'Invalid email address').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    if (req.headers['x-validate']) {
      return res.json({ errors: errors });
    } else {
      req.flash('errors', errors);
      return res.render('account/login');
    }
  }
  
  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      if (req.headers['x-validate']) {
        return res.json({ errors: [ { param: 'email', msg: ''}, { param: 'password', msg: 'Invalid email address or password' } ] });
      } else {
        req.flash('errors', { msg: info.message });
        return res.redirect('/login');
      }
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 * Signup page.
 */

exports.getSignup = function(req, res) {
  if (req.user) return res.redirect('/account');
  res.render('account/signup', { title: res.locals.title + " - Sign up" });
};

/**
 * POST /signup
 * Create a new local account.
 * @param email
 * @param password
 */

exports.postSignup = function(req, res, next) {
  if (req.user) return res.redirect('/account');
  
  req.assert('email', 'Invalid email address').isEmail();
  req.assert('password', 'Your password must be at least 4 characters').len(4);
  req.assert('confirmPassword', 'The passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    if (req.headers['x-validate']) {
      return res.json({ errors: errors });
    } else {
      req.flash('errors', errors);
      return res.render('account/signup');
    }
  }

  // If user does not exist, create account
  var user = new User({
    email: req.body.email,
    password: req.body.password
  });

  User.findOne({ email: req.body.email }, function(err, existingUser) {
    
    // Check if user exists already
    if (existingUser) {
      var msg = 'An account with that email address already exists';
      if (req.headers['x-validate']) {
        return res.json({ errors: [ { param: 'email', msg: msg } ] });
      } else {
        req.flash('errors', { param: 'email', msg: msg });
        return res.render('account/signup');
      }
    }
    
    // If it's just a validation request, return without error
    if (req.headers['x-validate'])
      return res.json({ errors: errors });
    
    user.save(function(err) {
      if (err) return next(err);
      req.logIn(user, function(err) {
        if (err) return next(err);
        res.redirect('/');
      });
    });
    
  });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = function(req, res) {
  res.render('account/profile', { title: res.locals.title + " - Your profile" });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = function(req, res, next) {
  req.assert('email', 'Invalid email address').isEmail();

  var errors = req.validationErrors();

  if (errors) {
    if (req.headers['x-validate']) {
      return res.json({ errors: errors });
    } else {
      req.flash('errors', errors);
      return res.render('account/profile');
    }
  }
  
  User.findById(req.user.id, function(err, user) {
    
    // @todo If email address changed, check to see if in use and return error (so x-validate doesn't trigger an update)
    
    if (err) return next(err);
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.organization = req.body.organization || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';

    user.save(function(err) {
      
      // Check for duplicates
      if (err) {
        if (err.code == '11000') {
          var msg = 'An account with that email address already exists.';
          if (req.headers['x-validate']) {
            return res.json({ errors: [ { param: 'email', msg: msg } ] });
          } else {
            req.flash('errors', { param: 'email', msg: msg });
            return res.render('account/signup');
          }
        } else {
          // Other errors
          if (err) return next(err);
        }
      } 
      
      req.flash('success', { msg: 'Your profile information has been updated.' });
      res.redirect('/profile');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 * @param password
 */
exports.postUpdatePassword = function(req, res, next) {
  req.assert('password', 'Your password must be at least 4 characters').len(4);
  req.assert('confirmPassword', 'The passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (req.headers['x-validate'])
    return res.json({ errors: errors });

  if (errors) {
    req.flash('errors', errors);
    return res.render('account');
  }

  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user.password = req.body.password;

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Your password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    if (err) return next(err);
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 * @param provider
 */
exports.getOauthUnlink = function(req, res, next) {
  var provider = req.params.provider;
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user[provider] = undefined;
    user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider; });
    
    var providerName = provider.substr(0, 1).toUpperCase() + provider.substr(1);
    user.save(function(err) {
      if (err) return next(err);
      req.flash('info', { msg: "Your " + providerName + ' account has been unlinked.' });
      res.redirect('/account');
    });
  });
};

/**
 * GET /change-password/:token
 * Reset Password page.
 */
exports.getChangePassword = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({ resetPasswordToken: req.params.token })
    .where('resetPasswordExpires').gt(Date.now())
    .exec(function(err, user) {
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/reset-password');
      }
      res.render('account/change-password', { title: res.locals.title + " - Change password" });
    });
};

/**
 * POST /change-password/:token
 * Process the reset password request.
 * @param token
 */
exports.postChangePassword = function(req, res, next) {
  req.assert('password', 'Your password must be at least 4 characters.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function(done) {
      User
        .findOne({ resetPasswordToken: req.params.token })
        .where('resetPasswordExpires').gt(Date.now())
        .exec(function(err, user) {
          if (!user) {
            req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('back');
          }

          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err) {
            if (err) return next(err);
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
    },
    function(user, done) {
      var transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: secrets.sendgrid.user,
          pass: secrets.sendgrid.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: config.app.email,
        subject: config.app.name+' - Your password has been changed',
        text: 'Hello,\n\n' +
              'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n' +
              '\n\n-- \n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('success', { msg: 'Success! Your password has been changed.' });
        done(err);
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
};

/**
 * GET /reset-password
 * Forgot Password page.
 */
exports.getResetPassword = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/reset-password', { title: res.locals.title + " - Password reset" });
};

/**
 * POST /reset-password
 * Create a random token, then the send user an email with a reset link.
 * @param email
 */
exports.postResetPassword = function(req, res, next) {
  req.assert('email', 'Please enter a valid email address.').isEmail();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/reset-password');
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
        if (!user) {
          req.flash('errors', { msg: 'No account with that email address exists.' });
          return res.redirect('/reset-password');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: secrets.sendgrid.user,
          pass: secrets.sendgrid.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: config.app.email,
        subject: config.app.name+ ' - Password reset',
        text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' + req.headers.host + '/change-password/' + token + '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n' +
              '\n\n-- \n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('info', { msg: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/reset-password');
  });
};
