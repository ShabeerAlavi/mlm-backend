const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NodelistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    nodeId:{
        type:Number,    
    },
    ref_node:{
        type:String,
    },
    ref_node_code:{
       type:Number,
    },
    dateCreated: {
        type: Date,
        default: new Date()
    },
});

module.exports = Nodelist = mongoose.model('Nodelist', NodelistSchema);