let mongoose = require("mongoose");
let orderSchema = new mongoose.Schema({
  items: {
    id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item"
  }},
  id: String,
  name: String,
  qty: {
    type: Number,
    default: 1
},
  price: Number,
  image: String,
  amount: Number,
  sellerEmail: String,
  sellerName: String,
  sellerMobile: Number,
  sellerAddline1: String,
  sellerAddline2: String,
  sellerCity: String,
  sellerZipcode: Number,
  sellerState: String,
  sellerCountry: String,
  buyerEmail: String,
  buyerName: String,
  buyerMobile: Number,
  buyerAddline1: String,
  buyerAddline2: String,
  buyerCity: String,
  buyerZipcode: Number,
  buyerState: String,
  buyerCountry: String,
  paymentId: String,
  
});


module.exports = mongoose.model("Order", orderSchema);
