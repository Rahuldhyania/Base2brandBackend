const express = require("express");
const router = express.Router();
const {
  getAllContactInfo,
  getContactInfoByType,
  createOrUpdateContactInfo,
} = require("../controllers/contactInfoController");
const multer = require("multer");
const path = require("path");

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");  // Folder where files will be stored temporarily
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Filename with timestamp
  },
});

const upload = multer({ storage });

// POST: Create or update contact info (Sales Inquiry or Quick Connect)
router.post("/contact-info", upload.single("icon"), createOrUpdateContactInfo);

// GET: Retrieve contact info by type (Sales Inquiry or Quick Connect)
router.get("/contact-info/:type", getContactInfoByType);

// GET: Retrieve all contact info
router.get("/contact-info", getAllContactInfo);

module.exports = router;
