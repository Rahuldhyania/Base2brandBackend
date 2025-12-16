// models/logoModel.js
const mongoose = require('mongoose');

const logoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
});

module.exports = mongoose.model('Logo', logoSchema);
