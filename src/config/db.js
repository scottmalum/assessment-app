const mongoose = require('mongoose');
require("dotenv").config();
const connectDB = async () => {
  mongoose.set("toJSON", { virtuals: true });
  mongoose.set("toObject", { virtuals: true });             
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: true,
  });
  console.log(`Mongo db connected: ${conn.connection.host}`);
};

module.exports = connectDB;
