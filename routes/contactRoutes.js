const express = require("express");
const router = express.Router();
const {
  createContact,
  getContacts,
  getContactById,
  updateContactById,
  deleteContactById,
  searchContacts, // New searchContacts controller
} = require("../controllers/contactController");
const validateId = require("../middleware/validateObjectId"); // Middleware for ID validation

// POST route for creating a new contact
router.post("/contact-us", createContact);

// GET route for retrieving all contacts
router.get("/contacts", getContacts);

// GET route for searching contacts (with pagination and date range)
router.get("/contacts/search", searchContacts); // New search route

// GET route for retrieving a contact by ID
router.get("/contacts/:id", validateId, getContactById); // Validate ID

// PUT route for updating a contact by ID
router.put("/contacts/:id", validateId, updateContactById); // Validate ID

// DELETE route for deleting a contact by ID
router.delete("/contacts/:id", validateId, deleteContactById); // Validate ID

module.exports = router;
