// db-connection.js
const mongoose = require('mongoose');

mongoose.connect(process.env.DB, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));
