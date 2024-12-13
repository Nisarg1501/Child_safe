const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["parent", "child"],
    default: "parent",
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  lastLoginLocation: {
    type: String,
    default: null,
  },
  lastLoginDate: {
    type: Date,
    default: null,
  },
  name: { type: String },
  dailyLimit: {
    type: Number,
    default: 10,
  },
  weeklyLimit: {
    type: Number,
    default: 70,
  },
  usage: {
    today: { type: Number, default: 0 },
    week: { type: Number, default: 0 },
    lastReset: { type: Date, default: new Date() },
  },
  resetToken: String,
  resetTokenExpiry: Date,
});

const User = mongoose.model("User", userSchema);
module.exports = User;
