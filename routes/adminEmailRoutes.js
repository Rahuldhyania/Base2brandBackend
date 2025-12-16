// routes/adminEmailRoutes.js
const express = require("express");
const router = express.Router();
const {
  createOrUpdateAdminEmail,
  getAdminEmailByType,
  getAllAdminEmails,
  deleteAdminEmail,
} = require("../controllers/adminEmailController");

// POST: Create or update admin email data (Sales Inquiry or Quote)
router.post("/create/admin-email", createOrUpdateAdminEmail);

// GET: Retrieve admin email data by type (Sales Inquiry or Quote)
router.get("/admin-email/:type", getAdminEmailByType);

// GET: Retrieve all admin email data
router.get("/admin-email", getAllAdminEmails);

// DELETE: Delete admin email data by type
router.delete("/admin-email/:type", deleteAdminEmail);

module.exports = router;
