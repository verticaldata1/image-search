var mongoose = require("mongoose");

var recentSchema = mongoose.Schema({
  time: {type: String, required: true},
  term: {type: String, required: true}
});

var Recent = mongoose.model("Recent", recentSchema);
module.exports = Recent;