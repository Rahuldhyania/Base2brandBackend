// controllers/adminEmailController.js
const AdminEmail = require("../models/adminEmailModel");

// Create or update admin email data
exports.createOrUpdateAdminEmail = async (req, res) => {
  try {
    const { type, email, cc } = req.body;

    // Check if the type is valid (either adminContactUsEmail or adminQuoteEmail)
    if (!["adminContactUsEmail", "adminQuoteEmail"].includes(type)) {
      return res.status(400).json({ error: "Invalid email type" });
    }

    // Ensure CC is an array of emails
    if (!Array.isArray(cc) || cc.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one CC email is required" });
    }

    // Check if the email already exists in the database for the given type
    let adminEmail = await AdminEmail.findOne({ type });

    if (adminEmail) {
      // If the entry exists, update it
      adminEmail.email = email;
      adminEmail.cc = cc;
      await adminEmail.save();
      return res.status(200).json({
        message: `${type} updated successfully`,
        adminEmail,
      });
    } else {
      // If the entry doesn't exist, create a new one
      adminEmail = new AdminEmail({
        type,
        email,
        cc,
      });
      await adminEmail.save();
      return res.status(201).json({
        message: `${type} created successfully`,
        adminEmail,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Get admin email data by type
exports.getAdminEmailByType = async (req, res) => {
  try {
    const { type } = req.params;
    const adminEmail = await AdminEmail.findOne({ type });

    if (!adminEmail) {
      return res.status(404).json({ error: `${type} not found` });
    }

    res.status(200).json({
      message: `${type} fetched successfully`,
      adminEmail,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Get all admin email data
exports.getAllAdminEmails = async (req, res) => {
  try {
    const adminEmails = await AdminEmail.find();
    res.status(200).json({
      message: "All admin emails fetched successfully",
      adminEmails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Delete admin email data by type
exports.deleteAdminEmail = async (req, res) => {
  try {
    const { type } = req.params;
    const adminEmail = await AdminEmail.findOneAndDelete({ type });

    if (!adminEmail) {
      return res.status(404).json({ error: `${type} not found` });
    }

    res.status(200).json({
      message: `${type} deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
