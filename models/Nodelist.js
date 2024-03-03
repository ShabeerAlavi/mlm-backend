const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NodelistSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true, // Ensure a user is associated
  },
  nodeId: {
    type: Number,
    // required: true,
    unique: true, // Enforce unique node IDs
  },
  nodeSl: {
    type: Number,
    // required: true,
    unique: true, // Set initial value for nodeSl
  },
  ref_node: {
    type: String,
  },
  ref_upiId:{
    type: String,
  },
  upiId: {
    type: String,
  },
  isMaturedNode: {
    type: Boolean,
   required: true,
   default: false,
  },
  maturedNode: {
    type: Array,
   required: true,
   default: [],
  },
  ref_node_code: {
    type: Number,
  },
  dateCreated: {
    type: Date,
    default: new Date(),
  },
});

// Pre-save middleware to handle auto-increment for nodeId
// NodelistSchema.pre('save', async function (next) {
//     console.log("save preeee");
//   const nodelist = this; // Refer to the current document

//   // Check if the document is newly created (i.e., `nodeId` is not yet set)
//   if (!nodelist.nodeId) {
//     try {
//       const counterDoc = await Counter.findOneAndUpdate(
//         {}, // Empty query to match the single document
//         { $inc: { sequence_value: 1 } }, // Increment sequence_value by 1
//         { new: true } // Return the updated document
//       );

//       if (!counterDoc) {
//         // Handle potential error if counter document is not found
//         return next(new Error('Failed to get sequence value'));
//       }
//       nodelist.nodeSl= counterDoc.sequence_value;
//       nodelist.nodeId = counterDoc.sequence_value + 1000; // Start from 1000
//     } catch (err) {
//       return next(err);
//     }
//   }

//   next(); // Proceed with saving the document
// });

const CounterSchema = new Schema({
  sequence_value: {
    type: Number,
    required: true,
    default: 999, // Initial value for the counter (adjust if needed)
  },
});

const Counter = mongoose.model('Counter', CounterSchema);

module.exports = Nodelist = mongoose.model('Nodelist', NodelistSchema);
