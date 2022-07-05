let mongoose = require("mongoose");


let ItemSchema = new mongoose.Schema({
  name: String,

  image: {type: String, required: true},

  seller: String,
  sellerName: String,
  sellerMobile: Number,

  sellerId: String,
  sellerAddline1: String,
  sellerAddline2: String,
  sellerCity: String,
  sellerZipcode: Number,
  sellerState: String,
  sellerCountry: String,
  category: String,

  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  description: String,
  material: String,
  weight: Number
});

module.exports = mongoose.model("Item", ItemSchema);
