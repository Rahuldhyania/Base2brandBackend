const validateId = (req, res, next) => {
  const id = req.params.id;
  
  // Check if the ID is a valid integer (PostgreSQL uses integer IDs)
  if (!id || isNaN(parseInt(id)) || parseInt(id) <= 0) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  
  // Set the parsed ID back to the params
  req.params.id = parseInt(id);
  next();
};

module.exports = validateId;
