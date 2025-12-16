const Address = require("../models/addressModel");

// Create a new address (POST)
exports.createAddress = async (req, res) => {
  try {
    const { street, city, state, zipCode, country, countryCode, mobileNumber } =
      req.body;

    // Check if an address with the same mobile number already exists
    const existingAddress = await Address.findOne({
      mobileNumber: mobileNumber,
    });
    if (existingAddress) {
      return res
        .status(400)
        .json({ error: "This mobile number already exists." });
    }

    // Create and save the new address
    const newAddress = new Address({
      street,
      city,
      state,
      zipCode,
      country,
      countryCode,
      mobileNumber,
    });

    await newAddress.save();
    res.status(201).json({
      message: "Address created successfully!",
      address: newAddress,
    });
  } catch (err) {
    console.error(err);
    // Handle MongoDB duplicate key error for mobileNumber
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ error: "This mobile number already exists." });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Get all addresses (GET)
exports.getAllAddresses = async (req, res) => {
  try {
    const addresses = await Address.find();
    res.status(200).json({
      message: "Addresses fetched successfully",
      addresses: addresses,
    });
  } catch (error) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Get address by country code (GET /:countryCode)
exports.getAddressByCountryCode = async (req, res) => {
  try {
    const { countryCode } = req.params;
    console.log(countryCode, "xxxxxxxxxxxxx");

    // Correctly use await to get the result of the query
    const address = await Address.findOne({ countryCode });

    // Check if no address is found
    if (!address) {
      return res.status(404).json({ error: "No address found for this country code" });
    }

    res.status(200).json({
      message: "Address fetched successfully by country code",
      address,  // Send the address directly (no circular structure)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};


// Update address (PUT /:id)
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { street, city, state, zipCode, country, countryCode, mobileNumber } =
      req.body;

    // Find and update the address
    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      {
        street,
        city,
        state,
        zipCode,
        country,
        countryCode,
        mobileNumber,
      },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.status(200).json({
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Delete address (DELETE /:id)
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id, "xxxxxxxxxxxx");

    // Find and delete the address by ID
    const deletedAddress = await Address.findByIdAndDelete(id);

    if (!deletedAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error(error); // Corrected from 'err' to 'error'
    res.status(500).json({ error: "Something went wrong" });
  }
};
