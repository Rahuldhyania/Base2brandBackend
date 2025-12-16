const Quote = require("../models/quoteModel");
const { sequelize } = require("../config/db");
const { Op } = require("sequelize");
const os = require("os");
const sendEmail = require("../utils/emailService");

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

const userRequestHtml = ({ name, services, projectType, mobileNo }) => `
    <div class="email_box" style=" filter: invert(1); padding: 20px; border-radius: 10px;  width: 100%;">
    <div style=" padding: 10px; text-align: center; width: 100%; margin: auto;"> 
    <div style="text-align:center;font-size:45px;color:#2b2827 !important;margin-bottom:10px;"> <b>Base<span style="color: #f47b52;font-weight: 800;">2</span>Brand</b></div>
            <div style="margin-top: 1rem; font-size: 30px; font-weight: 800;color:#f47b52 !important; margin-bottom:30px !important;">THANK YOU FOR YOUR TRUST</div>
            <div style="margin-bottom: 10px;color:#2b2827 !important;">Welcome, <b style="color: #f47b52;">${name}</b></div>
            <p style="font-size: 14px; line-height: 20px; margin-top: 0px;color:#2b2827 !important;">Thank you for showing interest in <b style="color: #f47b52;">Base2Brand</b>! We’ve received your request for the following service(s): <b style="color: #f47b52;">${services.join(
              ", "
            )}</b> under the quote type <b style="color: #f47b52;">${projectType}</b>.</p>
            <p style="font-size: 14px; line-height: 20px; margin-top: 0px; color:#2b2827 !important;">Our team is reviewing the details of your project and will reach out to you shortly to discuss the specifics and provide a tailored quote.</p>
            <p style="font-size: 14px; line-height: 20px; margin-top: 0px; color:#2b2827 !important;">If you have any additional information to share, feel free to reply to this email or contact us directly at <b style="color: #f47b52;">${mobileNo}</b></p>
            <p style="font-size: 14px; line-height: 20px; margin-top: 0px; color:#2b2827 !important;">Looking forward to collaborating with you!</p>
            <p style="font-size: 16px; line-height: 20px; margin-top: 0px; color:#2b2827 !important;"><b>Best regards,</b></p>
            <p style="font-size: 14px; line-height: 20px; margin-top: 0px; color:#2b2827 !important;"><b style="color: #f47b52;">Base2Brand</b> Team</p>

          <a style="color: #fff; background: #000; text-decoration: auto; padding: 10px 20px; border-radius: 40px; margin-top: 15px; display: block; margin: auto; width: fit-content;" href="https://base2brand.com/" target="_blank">Visit site</a>
        </div>
        <p></p>
    </div>
`;

// admin HTML generation
const adminRequestHtml = ({
  name,
  email,
  mobileNo,
  country,
  services,
  projectType,
  projectDescription,
}) => `
    <div class="email_box" style="background: #000; padding: 20px; border-radius: 10px; width: 500px; font-family: sans-serif; background-image: url(https://base2brand.com/_next/static/media/radial_bg.3de8aa0a.svg);">
        <div style="text-align: center;">
            <img style="width: 250px;" src="https://base2brand.com/_next/static/media/logo.e9cf2080.svg" alt="">
        </div>
        <div style="text-align: center; padding: 10px;">
            <img src="https://res.cloudinary.com/dvjxdikqi/image/upload/v1732009145/blogs/hb1bq2jf5hwfvrzcfk4s.png" width="100px" alt="">
        </div>
        <h4 style="color: #fff;">Hello <b>Base2Brand</b> Team,</h4>
        <p style="color: #fff;">We’ve received a new request for a quote from our website. Below are the details:</p>
        <div style="color: #fff;">
            <p><b style="width: 140px; display: inline-block;">Name</b>: ${name}</p>
            <p><b style="width: 140px; display: inline-block;">Email</b>: ${email}</p>
            <p><b style="width: 140px; display: inline-block;">Phone</b>: ${mobileNo}</p>
            <p><b style="width: 140px; display: inline-block;">Country</b>: ${country}</p>
            <p><b style="width: 140px; display: inline-block;">Service(s) Opted</b>: ${services.join(
              ", "
            )}</p>
            <p><b style="width: 140px; display: inline-block;">Quote Type</b>: ${projectType}</p>
            <b>Description</b>
            <p style="font-size: 14px; line-height: 20px;">${projectDescription}</p>
            <p>Please review the request and connect with the user to discuss further details.</p>
            <b>Best Regards,</b>
            <a style="color: #000; background: #fff; text-decoration: auto; padding: 10px 20px; border-radius: 40px; margin-top: 15px; display: block; width: fit-content;" href="https://base2brand.com/" target="_blank">Visit site</a>
        </div>
    </div>
`;

exports.createQuote = async (req, res) => {
  try {
    const {
      services,
      projectType,
      projectDescription,
      name,
      email,
      country,
      mobileNo,
    } = req.body;

    if (!services || services.length === 0) {
      return res.status(400).json({
        message:
          "Validation error: Services field is required and cannot be empty.",
      });
    }
    if (!projectType) {
      return res
        .status(400)
        .json({ message: "Validation error: Project type is required." });
    }
    if (!projectDescription) {
      return res.status(400).json({
        message: "Validation error: Project description is required.",
      });
    }
    if (!name) {
      return res
        .status(400)
        .json({ message: "Validation error: Name is required." });
    }
    if (!email) {
      return res
        .status(400)
        .json({ message: "Validation error: Email is required." });
    }
    if (!country) {
      return res
        .status(400)
        .json({ message: "Validation error: Country is required." });
    }
    if (!mobileNo) {
      return res
        .status(400)
        .json({ message: "Validation error: Mobile number is required." });
    }

    const ipAddress = getIPAddress();

    const newQuote = await Quote.create({
      services,
      projectType,
      projectDescription,
      name,
      email,
      country,
      mobileNo,
      ipAddress,
    });

    try {
      // Send email to the user
      await sendEmail({
        to: email,
        subject: "Thank You for Your Quote Request",
        html: userRequestHtml({
          name,
          services,
          projectType,
          mobileNo,
          country,
        }),
      });

      // Send notification email to the admin
      await sendEmail({
        to: "tech@base2brand.com", // Admin email address
        subject: "New Quote Request Received",
        html: adminRequestHtml({
          name,
          email,
          mobileNo,
          country,
          services,
          projectType,
          projectDescription,
        }),
      });

      // Respond with success message
      res.status(201).json({
        message: "Quote created successfully, emails sent",
        newQuote,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      res.status(500).json({
        message: "Quote created, but one or more emails failed to send",
        newQuote,
        emailError: emailError.message,
      });
    }
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      // Handle Sequelize validation errors
      const validationErrors = error.errors.map((err) => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all quotes with pagination and sorting
exports.getQuotes = async (req, res) => {
  try {
    // Get page and limit from query parameters, set default values if not provided
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

    // Default sorting behavior: Sort by 'createdAt' in descending order (newest first)
    const sortBy = req.query.sortBy || "createdAt"; // Default to sorting by 'createdAt'
    const order = req.query.order === "asc" ? 1 : -1; // Default to descending order (-1), for ascending use "asc"

    // Calculate the starting index for pagination
    const skip = (page - 1) * limit;

    // Retrieve quotes with pagination and sorting
    const quotes = await Quote.findAll({
      offset: skip,
      limit: limit,
      order: [[sortBy, order === 1 ? 'ASC' : 'DESC']],
    });

    // Get total count of quotes for pagination info
    const totalQuotes = await Quote.count();

    res.status(200).json({
      message: "Quotes retrieved successfully",
      page,
      totalPages: Math.ceil(totalQuotes / limit),
      totalQuotes,
      quotes,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

// Get quote by ID
exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }
    res.status(200).json({
      message: "Quote retrieved successfully",
      quote,
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update quote by ID
exports.updateQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    await quote.update(req.body);
    
    res.status(200).json({
      message: "Quote updated successfully",
      quote,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      // Handle unique constraint error
      const field = error.errors[0].path;
      return res.status(400).json({
        message: `Duplicate field error: The ${field} already exists.`,
        field: field,
        value: error.errors[0].value,
      });
    }
    if (error.name === "SequelizeValidationError") {
      // Handle Sequelize validation errors
      const validationErrors = error.errors.map((err) => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete quote by ID
exports.deleteQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    await quote.destroy();
    
    res.status(200).json({
      message: "Quote deleted successfully",
      quote,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.searchQuotes = async (req, res) => {
  try {
    const { query, dateRange, page = 1, limit = 10 } = req.query;

    // Validate 'page' and 'limit'
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

    // Pagination logic
    const skip = (page - 1) * parseInt(limit);

    // Initialize where conditions
    const whereConditions = {};

    // Add search query
    if (query) {
      if (query.length < 3) {
        return res.status(400).json({
          message: "Query must be at least 3 characters long.",
        });
      }

      // Create search conditions for Sequelize
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } },
        { projectType: { [Op.iLike]: `%${query}%` } },
        { projectDescription: { [Op.iLike]: `%${query}%` } },
        { country: { [Op.iLike]: `%${query}%` } },
        { mobileNo: { [Op.iLike]: `%${query}%` } },
        // For array fields, we need to use a different approach
        sequelize.where(
          sequelize.fn('array_to_string', sequelize.col('services'), ','),
          { [Op.iLike]: `%${query}%` }
        ),
      ];
    }

    // Add date range filter
    if (dateRange) {
      const [startDateString, endDateString] = dateRange
        .split("to")
        .map((date) => date.trim());

      // Validate date range format
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

      // Add date range filter to the query
      whereConditions.createdAt = {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      };
    }

    // Retrieve quotes with pagination and sorting
    const quotes = await Quote.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']], // Sort by creation date (newest first)
      offset: skip,
      limit: parseInt(limit),
    });

    // Get total count of quotes matching the filter
    const totalQuotes = await Quote.count({ where: whereConditions });

    // If no quotes are found
    if (quotes.length === 0) {
      return res.status(404).json({
        message: "No quotes found matching the criteria.",
      });
    }

    res.status(200).json({
      message: "Quotes retrieved successfully",
      page: parseInt(page),
      totalPages: Math.ceil(totalQuotes / limit),
      totalQuotes,
      quotes,
    });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({
      message: "Server error occurred while fetching quotes.",
      error: error.message,
    });
  }
};
