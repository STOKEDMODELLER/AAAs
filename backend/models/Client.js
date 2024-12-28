const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  clientID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String },
  email: { type: String },
  contactNumber: { type: String },
  saID: { type: String },
  passport: { type: String },
});

module.exports = mongoose.model("Client", clientSchema);
