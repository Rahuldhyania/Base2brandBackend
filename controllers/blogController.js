const Blog = require("../models/blogModel");
const cloudinary = require("../config/cloudinaryConfig");
const fs = require("fs");
const os = require("os");
const { Op } = require("sequelize");
const { cacheRoute } = require("../config/cacheRoute");
const { invalidateCache } = require("../config/invalidateCache");

// Get the IP address of the current user
const getIPAddress = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    for (const network of networkInterfaces[interfaceName]) {
      if (network.family === "IPv4" && !network.internal) {
        return network.address;
      }
    }
  }
  return "IP not found";
};

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    // Upload the image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "blogs",
    });

    // Delete the file from the local server after uploading
    fs.unlinkSync(req.file.path);

    // Create a new blog document
    const {
      heading,
      description,
      pageTitle,
      pageDescription,
      pageUrl,
      slugUrl,
      status,
    } = req.body;

    const ipAddress = getIPAddress();

    if (
      !heading ||
      !description ||
      !pageTitle ||
      !pageDescription ||
      !pageUrl ||
      !slugUrl
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled out." });
    }

    const newBlog = await Blog.create({
      imageUrl: result.secure_url,
      heading,
      description,
      pageTitle,
      pageDescription,
      pageUrl,
      slugUrl,
      status: status === "true" || status === true, // Convert to boolean if necessary
      ipAddress,
    });

    // Invalidate relevant caches
    await invalidateCache("blogs-list");
    await invalidateCache("blog");

    res.status(201).json({
      message: "Blog created successfully",
      newBlog,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

// Get all blogs with pagination
exports.getBlogs = cacheRoute("blogs-list", 1800, async (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const blogs = await Blog.findAll({
    order: [["createdAt", "DESC"]],
    offset: skip,
    limit,
  });

  const totalBlogs = await Blog.count();

  return {
    message: "Blogs retrieved successfully",
    page,
    totalPages: Math.ceil(totalBlogs / limit),
    totalBlogs,
    blogs,
  };
});

// Get blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json({
      message: "Blog retrieved successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

exports.getBlogBySlug = async (req, res) => {
  console.log("Fetching blog with slugUrl:", req.params.slugUrl); // Debugging line

  try {
    const blog = await Blog.findOne({ where: { slugUrl: req.params.slugUrl } });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({
      message: "Blog retrieved successfully",
      blog,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

// Update blog by ID
exports.updateBlogById = async (req, res) => {
  try {
    const {
      heading,
      description,
      pageTitle,
      pageDescription,
      pageUrl,
      slugUrl,
      status,
    } = req.body;
    const updatedFields = {
      heading,
      description,
      pageTitle,
      pageDescription,
      pageUrl,
      slugUrl,
      status: status === "true" || status === true, // Convert to boolean if necessary
    };

    if (req.file) {
      // Upload the new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "blogs",
      });

      // Delete the file from the local server after uploading
      fs.unlinkSync(req.file.path);

      updatedFields.imageUrl = result.secure_url;
    }

    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await blog.update(updatedFields);

    await invalidateCache("blogs-list");
    await invalidateCache("blog");

    res.status(200).json({
      message: "Blog updated successfully",
      blog,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};
// Delete blog by ID
exports.deleteBlogById = async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await blog.destroy();

    await invalidateCache("blogs-list");
    await invalidateCache("blog");

    res.status(200).json({
      message: "Blog deleted successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

exports.searchBlogs = async (req, res) => {
  try {
    const { query, dateRange, page = 1, limit = 10 } = req.query;

    // Validation for 'page' and 'limit'
    if (isNaN(page) || page <= 0) {
      return res.status(400).json({
        message: "Invalid page number. Page must be a positive integer.",
      });
    }

    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({
        message: "Invalid limit value. Limit must be a positive integer.",
      });
    }

    // Pagination
    const skip = (page - 1) * parseInt(limit);

    // Initialize filter
    const filter = {};

    // Add query search
    if (query) {
      if (query.length < 3) {
        return res.status(400).json({
          message: "Query must be at least 3 characters long.",
        });
      }
      filter[Op.or] = [
        { heading: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        { pageTitle: { [Op.iLike]: `%${query}%` } },
        { pageDescription: { [Op.iLike]: `%${query}%` } },
        { pageUrl: { [Op.iLike]: `%${query}%` } },
        { slugUrl: { [Op.iLike]: `%${query}%` } },
        { ipAddress: { [Op.iLike]: `%${query}%` } },
      ];
    }

    // Add date range filter with validation
    if (dateRange) {
      const [startDateString, endDateString] = dateRange
        .split("to")
        .map((date) => date.trim());

      // Validate the date range format
      const parseDate = (dateString) => {
        const [day, month, year] = dateString.split("/").map(Number);
        return new Date(year, month - 1, day); // Month is zero-based
      };

      const startDate = parseDate(startDateString);
      const endDate = parseDate(endDateString);

      // Check if parsed dates are valid
      if (!startDate.getTime() || !endDate.getTime()) {
        return res.status(400).json({
          message: "Invalid date range format. Use 'dd/mm/yyyy to dd/mm/yyyy'.",
        });
      }

      // Set the start of the day (00:00:00) for the start date
      startDate.setHours(0, 0, 0, 0);
      // Set the end of the day (23:59:59) for the end date
      endDate.setHours(23, 59, 59, 999);

      // Add date range to filter if valid
      filter.createdAt = {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      };
    }

    // Retrieve filtered and paginated blogs
    const blogs = await Blog.findAll({
      where: filter,
      order: [["createdAt", "DESC"]], // Sort by newest first
      offset: skip,
      limit: parseInt(limit),
    });

    // Get total count of filtered blogs
    const totalBlogs = await Blog.count({ where: filter });

    // Check if no blogs are found
    if (blogs.length === 0) {
      return res.status(404).json({
        message: "No blogs found matching the criteria.",
      });
    }

    res.status(200).json({
      message: "Blogs retrieved successfully",
      page: parseInt(page),
      totalPages: Math.ceil(totalBlogs / limit),
      totalBlogs,
      blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({
      message: "Server error occurred while fetching blogs.",
      error: error.message,
    });
  }
};
