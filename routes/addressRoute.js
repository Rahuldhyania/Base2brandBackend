const express = require("express");
const router = express.Router();
const {
  updateAddress,
  getAddressByCountryCode,
  getAllAddresses,
  createAddress,
  deleteAddress,
} = require("../controllers/addressController");
const validateObjectId = require("../middleware/validateObjectId");

// POST: Create a new address
router.post("/createAddress", createAddress);

// GET: Retrieve all addresses
router.get("/addresses", getAllAddresses);

// GET: Retrieve addresses by country code
router.get("/addresses/:countryCode", getAddressByCountryCode);

// PUT: Update an address by ID
router.put("/updateAddresses/:id", validateObjectId, updateAddress);

// DELETE: Delete an address by ID
router.delete("/deleteAddresses/:id", validateObjectId, deleteAddress);

module.exports = router;
