var express = require('express');
var router = express.Router();
var Prize = require('../models/prize')
var User = require('../models/user')

var devCheck = function (req, res, next) {
  if (req.user.isDev) {
    next();
  } else {
    res.redirect('/')
  }
}

router.get('/', devCheck, function (req, res, next) {
    res.render('users/dev', {user: req.user, message: req.query.message})
});

router.post('/switch', devCheck, function(req, res, next) {
  switch (req.body.status) {
    case 'teacher':
    User.updateOne({_id: req.user._id}, {$set: {isTeacher: true, isTreasurer: false}}, function(err, dev) {
        if(err) { res.send('err') }
    })
      break;
    case 'student':
    User.updateOne({_id: req.user._id}, {$set: {isTeacher: false, isTreasurer: false}}, function(err, dev) {
        if(err) { res.send('err') }
    })      
    break;
    case 'treasurer':
    User.updateOne({_id: req.user._id}, {$set: {isTeacher: false, isTreasurer: true}}, function(err, dev) {
        if(err) { res.send('err') }
    })
      break;
  }
  res.redirect('/dashboard')
});

router.post('/update', devCheck, function(req, res, next){
    User.findOne({username: req.body.username}, function(err, student) {
        if (err) { req.send('err') }
        if(student == null) {
            var string = encodeURIComponent('Null Student');
            res.redirect('/dev' + '?message=' + string);
        } else {
            student.kitCoins = student.kitCoins + req.body.incCoin
            student.ethsId = req.body.ethsId
            console.log(student.kitCoins)
            switch (req.body.status) {
                case 'teacher':
                    student.isTreasurer = false
                    student.isTeacher = true
                    break;
                case 'student':
                    student.isTreasurer = false
                    student.isTeacher = false
                    break;
                case 'treasurer':
                    student.isTreasurer = true
                    student.isTeacher = false
                    break;
            }   
            student.save(function(err, updatedStudent){
                if(err) {res.send('err')}
                var string = encodeURIComponent(req.body.username + ' was updated');
                res.redirect('/dev' + '?message=' + string);
            })
        }
    });
});


module.exports = router;