const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const keys = require('./keys')
const User = require('../models/user')

passport.serializeUser(function (user, done) {
    done(null, user.id) 
});

passport.deserializeUser(function (id, done) {
    User.findById(id).then(function (user) {
        done(null, user);
    });
});


passport.use(
    new GoogleStrategy({
        callbackURL: keys.google.callbackURL,
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret,
        userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    }, function (accessToken, refreshToken, profile, done) {
        //find if user exists
        User.findOne({googleId: profile.id}).then(function(currentUser) {
           if (currentUser) {
               done(null, currentUser);
           } else {
                //otherwise make new user
                new User({
                    username: profile.displayName,
                    googleId: profile.id,
                    ethsId: 0, 
                    kitCoins: 0, 
                    isTeacher: false,
                    isTreasurer: false,
                    isDev: false
                }).save().then(function (newUser) {
                    done(null, newUser)
                });   
           }
        });
    })
)