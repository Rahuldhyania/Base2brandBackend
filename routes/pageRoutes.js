const express = require("express");
const router = express.Router();
const pageController = require("../controllers/pageController");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Route to get page by slug (for frontend)
router.get("/slug/:slug", pageController.getPageBySlug);

// ✅ FIXED: Route to create a new page with multiple file uploads
router.post("/page/create", upload.any(), pageController.createPage);

// Alternative approach - accepts any field name (more flexible)
// router.post("/page/create", upload.any(), pageController.createPage);

// Route to get all pages
router.get("/page/getall", pageController.getAllPages);

// Route to get a specific page by ID
router.get("/page/:id", pageController.getPageById);

// Route to update a page by ID (with all sections)
router.put("/page/update/:id", upload.any(), pageController.updatePage);

// Route to delete a page by ID
router.delete("/page/delete/:id", pageController.deletePage);

router.get("/slug/:slug/:key", pageController.getPageBySlugKey);

module.exports = router;