var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
   username: String,
   ethsId: Number, 
   kitCoins: Number, 
   googleId: String,
   awaitingPrizes: [{ type: Schema.Types.ObjectId, ref: 'Prize' }],
   redeemedPrizes: [{ type: Schema.Types.ObjectId, ref: 'Prize' }],
   isTeacher: Boolean,
   isTreasurer: Boolean, 
   isDev: Boolean,
   teacherConfirm: [{
     student: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
     prize: [{ type: Schema.Types.ObjectId, ref: 'Prize' }],
     studentReceived: Boolean
     //apparently an _id appears too 
   }]
});

var User = mongoose.model('User', userSchema);

module.exports = User;