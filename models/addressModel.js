const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    countryCode: { type: String, required: true },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /\+?[1-9]\d{1,14}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid mobile number!`,
      },
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model("Address", addressSchema);