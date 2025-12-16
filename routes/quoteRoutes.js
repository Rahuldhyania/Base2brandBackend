const express = require("express");
const router = express.Router();
const validateId = require("../middleware/validateObjectId"); // Middleware for ID validation
const {
  createQuote,
  getQuotes,
  getQuoteById,
  updateQuoteById,
  deleteQuoteById,
  searchQuotes, // Add the searchQuotes controller
} = require("../controllers/quoteController");

// Create a new quote
router.post("/quotes", createQuote);

// Get all quotes
router.get("/quotes", getQuotes);

// Search quotes with filters (query, date range, pagination)
router.get("/quotes/search", searchQuotes); // New search route

// Get quote by ID with ID validation
router.get("/quotes/:id", validateId, getQuoteById);

// Update quote by ID with ID validation
router.put("/quotes/:id", validateId, updateQuoteById);

// Delete quote by ID with ID validation
router.delete("/quotes/:id", validateId, deleteQuoteById);

module.exports = router;
