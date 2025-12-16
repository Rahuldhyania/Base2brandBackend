const express = require("express");
const multer = require("multer");
const router = express.Router();
const validateId = require("../middleware/validateObjectId"); // Adjust the path based on your project structure
const {
  createBlog,
  getBlogs,
  getBlogBySlug,
  getBlogById,
  updateBlogById,
  deleteBlogById,
  searchBlogs,
} = require("../controllers/blogController");

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Define routes
router.get("/blogs/search", searchBlogs); // Search blogs
router.get("/blogs", getBlogs); // Get all blogs
router.get("/blogs/slug/:slugUrl", getBlogBySlug); // Get blog by slugUrl
router.get("/blogs/:id", validateId, getBlogById); // Get blog by ID
router.post("/blogs", upload.single("image"), createBlog); // Create a blog
router.put("/blogs/:id", upload.single("image"), updateBlogById); // Update blog
router.delete("/blogs/:id", deleteBlogById); // Delete blog

module.exports = router;
