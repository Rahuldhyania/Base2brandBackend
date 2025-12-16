const cloudinary = require("cloudinary").v2;
const ContactInfo = require("../models/contactInfoModel");

exports.createOrUpdateContactInfo = async (req, res) => {
  try {
    const { type, content } = req.body;  // Use 'content' instead of 'contect'
    const { file } = req;  // Change 'files' to 'file' since we use 'upload.single'

    // Check if the icon file is provided
    if (!file) {
      return res.status(400).json({ error: "Icon image is required" });
    }

    // Upload the icon to Cloudinary
    const iconResult = await cloudinary.uploader.upload(file.path, {
      folder: "contact-icons",  // Optional folder name
    });

    // Check if data for the given type already exists
    let contactInfo = await ContactInfo.findOne({ type });

    if (contactInfo) {
      // If the entry exists, update it
      contactInfo.icon = iconResult.secure_url;
      contactInfo.content = content;  // Updated to 'content'
      await contactInfo.save();
      return res.status(200).json({
        message: `${type} updated successfully`,
        contactInfo,
      });
    } else {
      // If the entry doesn't exist, create a new one
      contactInfo = new ContactInfo({
        type,
        icon: iconResult.secure_url,
        content,  // Updated to 'content'
      });
      await contactInfo.save();
      return res.status(201).json({
        message: `${type} created successfully`,
        contactInfo,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Get a contact info by type (Sales Inquiry or Quick Connect)
exports.getContactInfoByType = async (req, res) => {
  try {
    const { type } = req.params;
    const contactInfo = await ContactInfo.findOne({ type });

    if (!contactInfo) {
      return res.status(404).json({ error: `${type} not found` });
    }

    res.status(200).json({
      message: `${type} fetched successfully`,
      contactInfo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Get all contact info (both Sales Inquiry and Quick Connect)
exports.getAllContactInfo = async (req, res) => {
  try {
    const contactInfos = await ContactInfo.find();  // Fixed variable name here
    res.status(200).json({
      message: "All contact info fetched successfully",
      contactInfos,  // Corrected variable name
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
