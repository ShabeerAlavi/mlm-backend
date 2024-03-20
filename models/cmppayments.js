const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CmppaymentsSchema = new Schema({
  name:{
    type:String
  },
  mobile:{
    type: String,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true, // Ensure a user is associated
  },
  upiId:{
    type:String
  },
  payment_status:{
    type:String
  },
  paymentDetails:{
    type:Array
  },
  dateCreated: {
    type: Date,
    default: new Date(),
  },
});

module.exports = CmpPayment = mongoose.model('CmpPayment', CmppaymentsSchema);