const mongoose = require("mongoose");

const contactInfoSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["for sales inquiry", "for quick connect"],
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    content: {  // Fixed typo here (was 'contect')
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactInfo", contactInfoSchema);
