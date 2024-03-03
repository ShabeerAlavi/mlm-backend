const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
   email: {
        type: String,
        required: true

    },

    mobile: {
        type: String,
        required:true
    },
    UpiId: {
        type: String,
    },
    ifsc: {
        type: String,
    },
    accountNumber: {
        type: String,
    },
    bankName: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    firstPaymentStatus:{
        type: Boolean,
        default: false
    },
    secondPaymentStatus:{
        type: Boolean,
        default: false
    },
    bankDetailsStatus:{
        type: Boolean,
        default: false
    },

    dateCreated: {
        type: Date,
        default: new Date()
    },
    nodeId:{
        type:Number,    
    },
    ref_node:{
        type:String,
    },
    ref_upiId:{
        type:String,
        default:"1"
    },
    ref_node_code:{
       type:Number,
    },
    lastSeen: {
        type: Date
    }
});

module.exports = Users = mongoose.model('users', UserSchema);