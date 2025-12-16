// controllers/logoController.js
const cloudinary = require('../config/cloudinaryConfig');  // Cloudinary config file
const Logo = require('../models/logoModal');  // Logo model

// Create or update the logo (POST /create-upload-logo)
exports.createUploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    // Upload the logo image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'logos',  // Optional: You can set the folder in Cloudinary
    });

    // Check if a logo already exists in DB (only one logo in the system)
    let existingLogo = await Logo.findOne();

    if (existingLogo) {
      // Update the logo if it exists
      existingLogo.url = result.secure_url;
      existingLogo.public_id = result.public_id;
      await existingLogo.save();
    } else {
      // Create new logo entry if none exists
      const newLogo = new Logo({
        url: result.secure_url,
        public_id: result.public_id,
      });
      await newLogo.save();
    }

    res.status(200).json({
      message: 'Logo uploaded successfully!',
      logoUrl: result.secure_url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Get the logo data (GET /get-logo)
exports.getLogo = async (req, res) => {
  try {
    // Retrieve the only logo record from the database
    const logo = await Logo.findOne();

    if (!logo) {
      return res.status(404).json({ error: 'Logo not found' });
    }

    res.status(200).json({
      message: 'Logo fetched successfully',
      logo: logo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Update logo data (PUT /update-logo)
exports.updateLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    // Upload the logo image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'logos',  // Optional: You can set the folder in Cloudinary
    });

    // Check if a logo exists in DB
    let existingLogo = await Logo.findOne();

    if (!existingLogo) {
      return res.status(404).json({ error: 'Logo not found for update' });
    }

    // Update the existing logo in DB
    existingLogo.url = result.secure_url;
    existingLogo.public_id = result.public_id;
    await existingLogo.save();

    res.status(200).json({
      message: 'Logo updated successfully!',
      logoUrl: result.secure_url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
