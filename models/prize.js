var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var prizeSchema = new Schema({
   prizeName: String, 
   description: String, 
   dateCreated: { type: Date, default: Date.now },
   imageLink: String,
   price: Number, 
   quantityAvailable: Number, 
   coinsRedeemed: Number,
   peopleRedeemed: [{ type: Schema.Types.ObjectId, ref: 'User' }],
   creator: [{ type: Schema.Types.ObjectId, ref: 'User' }],
   deleted: Boolean
});

var Prize = mongoose.model('Prize', prizeSchema);

module.exports = Prize;