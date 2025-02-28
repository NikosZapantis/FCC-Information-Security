// models.js
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  stock: { type: String, required: true },
  likes: [String],  // Array of hashed IPs
});

const Stock = mongoose.model('Stock', stockSchema);

module.exports = { Stock };
