let mongoose = require("mongoose");

let categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true},
  slug: {
    type: String,
    required: true,
    unique: true},
  parentId: {type: String},
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item"
    }
  ]
});

module.exports = mongoose.model("Category", categorySchema);
