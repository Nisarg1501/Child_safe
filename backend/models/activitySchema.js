const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema({
  userId: String,
  url: String,
  timeSpent: Number, 
  timestamp: { type: Date, default: Date.now },
});

const ActivityUser = mongoose.model("Activity", userActivitySchema);
module.exports = ActivityUser;
