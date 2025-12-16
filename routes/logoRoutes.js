// routes/logo.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {createUploadLogo,getLogo,updateLogo} = require('../controllers/logoController');

// Set up storage engine using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Adding timestamp to avoid overwriting
  },
});

const upload = multer({ storage });

// Define routes for handling the logo
router.post('/create-upload-logo', upload.single('logo'), createUploadLogo);
router.get('/get-logo', getLogo);
router.put('/update-logo', upload.single('logo'), updateLogo);




module.exports = router;
