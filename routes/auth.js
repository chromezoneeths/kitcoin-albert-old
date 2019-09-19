var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user')
var keys = require('../config/keys')

router.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/')
});

router.get('/google', passport.authenticate('google', {
    scope: ['profile']
}));

router.get('/google/redirect', passport.authenticate('google', { failureRedirect: '/bad' }), function (req, res) {
  if (req.user.ethsId == 0) {
    res.render('users/profile')
  } else {
    res.redirect('/dashboard')
  }
});

router.post('/update', function (req, res, next){
  console.log(req.body.activationKey + " " + keys.activation.treasurer)
  if (req.body.activationKey == keys.activation.treasurer) {
    User.updateOne({ _id: req.user._id }, { "ethsId": undefined, "isTreasurer": true }, function (err, user) {
        if (err) {res.redirect('/dashboard')} 
        res.redirect('/dashboard')
    });
  } else if(req.body.activationKey == keys.activation.teacher) {
    User.updateOne({ _id: req.user._id }, { "ethsId": undefined, "isTeacher": true }, function (err, user) {
        if (err) {res.redirect('/dashboard')} 
        res.redirect('/dashboard')
    });
  } else if(req.body.activationKey == keys.activation.dev){
    User.updateOne({ _id: req.user._id }, { "ethsId": req.body.ethsId, "isDev": true }, function (err, user) {
        if (err) {res.redirect('/dashboard')} 
        res.redirect('/dashboard')
    });
  } else {
    User.updateOne({ _id: req.user._id }, { "ethsId": req.body.ethsId }, function (err, user) {
        if (err) {res.redirect('/dashboard')} 
        res.redirect('/dashboard')
    });
  }
});

module.exports = router;
