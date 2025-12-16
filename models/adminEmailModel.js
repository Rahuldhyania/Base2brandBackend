// models/adminEmailModel.js
const mongoose = require("mongoose");

const adminEmailSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["adminContactUsEmail", "adminQuoteEmail"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    cc: {
      type: [String], // Array of strings to store multiple CC emails
      required: true, // The CC array is required
      validate: {
        validator: function (value) {
          // Validate each email address in the array
          return value.every((email) => /^\S+@\S+\.\S+$/.test(email));
        },
        message: "Please provide valid CC email addresses",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminEmail", adminEmailSchema);
