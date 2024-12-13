const mongoose = require("mongoose");

const childSuggestionSchema = new mongoose.Schema({
  child_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
});

const childSuggestion = mongoose.model(
  "child_suggestion",
  childSuggestionSchema
);

module.exports = childSuggestion;
