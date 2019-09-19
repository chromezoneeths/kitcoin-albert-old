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

router.post('/redeem', authCheck, function(req, res, next) {
    //  rm money from student 
    //& edit prize for claimed coins 
    //& edit prize for person redeemed 
    //& return money to economy 
    //& send teacher reciept
    
    User.findOne({ _id: req.user._id }, function (err, user) {
        if (err) { console.log(err) };
        Prize.findOne({_id: req.body.prizeId}, function(err, prize) {
        if (err) { console.log(err) };
          if (prize == null) {
            var string = encodeURIComponent('You did not select a prize');
            res.redirect('/dashboard' + '?message=' + string);
          } else if (user.kitCoins >= prize.price) {
            //subtract money from student & update awaiting prizes
            user.awaitingPrizes.push(prize)
            user.kitCoins = user.kitCoins - prize.price;
            user.save(function (err) {  if (err) { console.log(err) }
            //add money back to treasurer 
            User.updateOne({isTreasurer: true}, { $inc: { kitCoins: prize.price } }, function (err, treasurer) { if (err) { console.log(err) } });
            // edit prize for people and money redeemed
            prize.coinsRedeemed = prize.coinsRedeemed + prize.price
            prize.peopleRedeemed.push(req.user._id)
            prize.save(function (err) {if(err) {console.log(err);}})});
            //send teacher reciept
            User.updateOne({_id: prize.creator[0]}, { $push: { teacherConfirm: {student: req.user._id, prize: prize._id, studentReceived: false} } }, function (err, numberAffected, creator) { 
              if (err) { console.log(err) } 
            });
            res.redirect('/dashboard')
          } else {
            var string = encodeURIComponent('You do not have enough KitCoin');
            res.redirect('/dashboard' + '?message=' + string);
          }
        })
    });
});

router.post('/new', teacherCheck, function (req, res, next){
    new Prize({
      prizeName: req.body.prizeName, 
      description: req.body.description, 
      imageLink: undefined,
      price: req.body.price,
      quantityAvailable: undefined,
      coinsRedeemed: 0,
      peopleRedeemed: [],
      creator: req.user._id,
      deleted: false
    }).save().then(function (newPrize) {
        res.redirect('/dashboard')
    });   
});

router.get('/delete/:id', treasurerCheck, function (req, res, next) {
    Prize.updateOne({ _id: req.params.id }, { "deleted": true }, function (err, prize) {
        if (err) { res.redirect('/dashboard')}
        res.redirect('/dashboard') 
    });
});

router.post('/edit', teacherCheck, function (req, res, next) {
  Prize.findOne({_id: req.body.id}, function(err, prize){
    if(err) {res.send('err') } 
      prize.prizeName = req.body.prizeName, 
      prize.description = req.body.description, 
      prize.price = req.body.price,
      prize.deleted = req.body.deleted
      console.log(req.body.deleted)
      prize.save(function (err) {
        if(err) {console.log(err)}
      });
      res.redirect('back')
  });
});

module.exports = router;
