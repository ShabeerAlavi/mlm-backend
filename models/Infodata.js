const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InfodataSchema = new Schema({
    UpiId: {
        type: String,
    },
    ifsc: {
        type: String,
    },
    accountNumber: {
        type: String,
    },
    dateCreated: {
        type: Date,
        default: new Date()
    },
});

module.exports = Infodata = mongoose.model('Infodata',InfodataSchema);