const express = require("express");
const router = express.Router();
const { login, deployefrontend, deployeBackend } = require("../controllers/authController");

// Login route 
router.post("/login", login);


// Pipeline Routes
router.post("/deployefrontend", deployefrontend);
router.post("/deployeBackend", deployeBackend);


module.exports = router;
