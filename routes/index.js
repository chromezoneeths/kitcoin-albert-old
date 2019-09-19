var express = require('express');
var router = express.Router();
var Prize = require('../models/prize')
var User = require('../models/user')

var authCheck = function (req, res, next) { //just check for auth
  if (!req.user) {
    res.redirect('/')
  } else {
    next();
  }
}

var teacherCheck = function (req, res, next) {
  if (req.user.isTeacher) {
    next();
  } else {
    res.redirect('/')
  }
}

var treasurerCheck = function (req, res, next) {
  if (req.user.isTreasurer) {
    next();
  } else {
    res.redirect('/')
  }
}

var devCheck = function (req, res, next) {
  if (req.user.isDev) {
    next();
  } else {
    res.redirect('/')
  }
}

// Public

router.get('/', function(req, res, next) {
  if(req.user) {
    res.redirect('/dashboard')
  } else {
    res.redirect('/auth/google')
  }
});

// General Auth

router.get('/dashboard', authCheck, function (req, res, next) {
    if (req.user.isTeacher) {
      //make middleware for general teacher request
      User.findOne({_id: req.user._id}).populate('teacherConfirm.student').populate('teacherConfirm.prize').exec(function(err, teacher){
        if (err) { res.send('err')}
          Prize.find({creator: req.user._id}, function(err, prizes) {
          if (err) { res.send('err')}
          res.render('users/teacher', { teacher: req.user, prizes: prizes, awaitingConfirms: teacher.teacherConfirm, message: req.query.message })
        });
      });
    } else if (req.user.isTreasurer) {
      Prize.find({}).populate('creator', 'username').exec(function (err, prizes) {
        if (err) { res.send('err')}
        User.find(function(err, allUsers){
        if (err) { res.send('err')}
          var teachers = [];
          var teacherCoin = 0;
          var studentCoin = 0;
          var treasurerCoin = 0;
          allUsers.forEach(function(user, index){
            if(user.isTeacher) {  //if teacher add coins and teacher to array
              teachers.push(user)
              teacherCoin = teacherCoin + user.kitCoins
            } else if (user.isTreasurer) {
              treasurerCoin = treasurerCoin + user.kitCoins
            } else { //if a student (not a treasurer or teacher)
              studentCoin = studentCoin + user.kitCoins
            }
          });
            res.render('users/treasurer', { economy: {teacher: teacherCoin, student: studentCoin, treasurer: treasurerCoin}, prizes: prizes, teachers: teachers, message: req.query.message })
        });
      });
    } else {
      Prize.find().populate('peopleRedeemed').populate('creator').exec(function (err, prizes) {
        if (err) { res.send('err')}
        User.findOne({_id: req.user._id}).populate('awaitingPrizes').populate('redeemedPrizes').exec(function(err, student){
          if (err) { res.send('err')}
          res.render('users/student', { teacher: req.user, prizes: prizes, student: student, message: req.query.message });
        })
      });
    }
});

router.get('/profile', authCheck, function(req, res, next) {
   res.render('users/profile') 
});

// Teacher

router.post('/student/search', teacherCheck, function(req, res, next){
  User.findOne({ethsId: req.body.ethsId}, function (err, student){
    if (err) { res.redirect('/dashboard') }
    if(student === null) {
        var string = encodeURIComponent('No student has that ID');
        res.redirect('/dashboard' + '?message=' + string);
      } else {
      //make middleware for general teacher page request
      User.findOne({_id: req.user._id}).populate('teacherConfirm.student').populate('teacherConfirm.prize').exec(function(err, teacher){
        if (err) { res.send('err')}
        Prize.find({creator: req.user._id}, function(err, prizes) {
          if (err) { res.send('err')}
          res.render('users/teacher', { teacher: req.user, awaitingConfirms: teacher.teacherConfirm, student: student, prizes: prizes })
        });
      });
    }
  });
});

router.post('/student/award', teacherCheck, function(req, res, next){
    User.findOne({_id: req.user._id}, function(err, teacher){
      if(err) { res.redirect('/dashboard') }
      if(teacher.kitCoins >= req.body.kitCoins) { //if teacher has enough KitCoins
          //update the student's balance
          User.findOne({ _id: req.body.id }, function (err, student){
            student.kitCoins = student.kitCoins + req.body.kitCoins
            student.save(function (err) {
                if(err) {console.error(err);}
            });
            if (err) { res.redirect('/dashboard') }
            //update the teacher's balance
            User.updateOne({ _id: req.user._id }, { $inc: { kitCoins: -req.body.kitCoins } },  function (err, teacher){if(err) { res.redirect('/dashboard') }});
              //take it back now yall
              //make middleware for general teacher page request
              User.findOne({_id: req.user._id}).populate('teacherConfirm.student').populate('teacherConfirm.prize').exec(function(err, teacher){
                if (err) { res.send('err')}
                res.redirect('/dashboard' + '?message=' + student.username + " was awarded " + req.body.kitCoins + " KitCoins!" )
              });
          });
      } else {
        var string = encodeURIComponent('You have too few KitCoin to award.');
        res.redirect('/dashboard' + '?message=' + string);
      }
    });
});

router.post('/student/confirm', teacherCheck, function(req, res, next) {
    // //change student prize status from awaiting to recieved
    User.updateOne({_id: req.body.studentId}, { $push: { redeemedPrizes: req.body.prizeId}, $pull :{ awaitingPrizes: req.body.prizeId }},function(err, student) {if(err){console.log(err)}});
    //change teacher reciept to studentRecieved True
    User.findOne({_id: req.user._id}).populate('teacherConfirm.student').populate('teacherConfirm.prize').exec(function(err, teacher) {
        if(err){console.log(err)}
        //find reciept and check off
        teacher.teacherConfirm.forEach(function(confirm, index){
          if(confirm._id == req.body.confirmId) { //when recieved confirm id matches id on receipt
              teacher.teacherConfirm[index].studentReceived = true
              teacher.save(function (err) {
                if(err) {console.log(err)}
              });
          }
        });
    });
    res.redirect('/dashboard');
});

// Treasurer

router.post('/sendpay', treasurerCheck, function(req, res, next) {
    User.updateMany({isTeacher: true}, {$inc: {kitCoins: req.body.kitCoins}}, function(err, teachers){
        User.updateOne({isTreasurer: true}, { $inc: {kitCoins: -Object.keys(teachers).length*req.body.kitCoins}}, function(err, treasurer){
          if(err){res.send('err')}
        })
        if(err){res.send('err')}
        var string = encodeURIComponent('paid ' +req.body.kitCoins+ ' to teachers');
        res.redirect('/dashboard' + '?message=' + string);
    });
})

module.exports = router;
