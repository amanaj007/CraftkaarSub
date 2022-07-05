let mongoose = require("mongoose");

let userSchema = new mongoose.Schema({
  username: String,
  name: String,
  password: String,
  isAdmin: {type: Boolean, enum:[true, false], required: true, default: false},
  mobile: Number,
  addline1: String,
  addline2: String,
  city: String,
  zipcode: Number,
  state: String,
  country: String,
  bank: String,
  ifsc: String,
  bankname: String,
  gst: String,
  pan: String,
  phonepe: String,
  paytm: String,
  googlepay: String,
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item"
    }
  ],
  resetPasswordToken: String,
  resetPasswordExpires: Date

});


module.exports = mongoose.model("Seller", userSchema);
