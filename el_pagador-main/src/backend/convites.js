const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const convitesSchema = new mongoose.Schema({
  _id: Number,
  email: String,
  group_id: Number,
  token: String,
  created_at: {
      type: Date,
      default: Date.now 
  },
  expires_at: Date,
  accepted: { 
      type: Boolean, 
      default: false 
  }
});

convitesSchema.plugin(AutoIncrement, { id: 'convite_seq', inc_field: '_id'});

module.exports = mongoose.model('Convites', convitesSchema);