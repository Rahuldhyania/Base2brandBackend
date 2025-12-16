const Contact = require("../models/contactModel");
const { sequelize } = require("../config/db");
const { Op } = require("sequelize");
const sendEmail = require("../utils/emailService");
const os = require("os");

//Get the ip address of the current user
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

// Note: PostgreSQL handles unique constraints differently than MongoDB indexes
// Unique constraints are managed at the database level and don't need manual removal

const usserContactHtml = ({ name, service }) => `
<div class="email_box" style=" filter: invert(1); padding: 20px; border-radius: 10px;  width: 100%;">
     
    <div style="color: #000; padding: 10px; text-align: center; width: 100%; margin: auto;"> 
     <div style="text-align:center;font-size:45px;color:#2b2827 !important;margin-bottom:10px;"> <b>Base<span style="color: #f47b52;font-weight: 800;">2</span>Brand</b></div>
        <h1 style="margin-top: 1rem; font-size: 30px; font-weight: 800;color:#2b2827 !important;margin-bottom:10px !important;">THANK YOU FOR YOUR TRUST</h1>
        <h2 style="margin-bottom: 10px;color:#2b2827 !important;">Welcome, <b style="color: #f47b52;">${name}</b></h2>
        <p style="font-size: 14px; line-height: 20px; margin-top: 0px;color:#2b2827 !important;">Thank you for connecting with us at <b>Base2Brand</b>. We’ve received your request for the following service: <b>${service}</b>. Our team will review your query and get in touch with you shortly.</p>
        <p style="font-size: 14px; line-height: 20px; margin-top: 0px;color:#2b2827 !important;">If you have any additional details or documents to share, feel free to reply to this email.</p>
        <p style="font-size: 14px; line-height: 20px; margin-top: 0px;color:#2b2827 !important;">Looking forward to assisting you!</p>
        <p style="font-size: 16px; line-height: 20px; margin-top: 0px;color:#2b2827 !important;"><b>Best regards,</b></p>
        <p style="font-size: 14px; line-height: 20px; margin-top: 0px;color:#2b2827 !important;"><b style="color: #f47b52;">Base2Brand</b> Team</p>

        <a style="color: #fff; background: #000; text-decoration: auto; padding: 10px 20px; border-radius: 40px; margin-top: 15px; margin: auto; display: block; width: fit-content;" href="https://base2brand.com/" target="_blank">Visit site</a>
    </div>
    <p></p>
</div>
`;

const adminContactHtml = ({
  name,
  email,
  mobileNo,
  country,
  service,
  comment,
}) => `
    <div class="email_box" style="background: #000; padding: 20px; border-radius: 10px; width: 500px; font-family: sans-serif; background-image: url(https://base2brand.com/_next/static/media/radial_bg.3de8aa0a.svg);">
        <div style="text-align: center;">
            <img style="width: 250px;" src="https://base2brand.com/_next/static/media/logo.e9cf2080.svg" alt="">
        </div>
        <div style="text-align: center; padding: 10px;">
            <img src="https://res.cloudinary.com/dvjxdikqi/image/upload/v1732009145/blogs/hb1bq2jf5hwfvrzcfk4s.png" width="100px" alt="">
        </div>
        <h4 style="color: #fff;">Hello <b>Base2Brand</b> Team,</h4>
        <p style="color: #fff;">We have received a new contact request from our website. Here are the details:</p>
        <div style="color: #fff;">
            <p><b style="width: 140px; display: inline-block;">Name</b>: ${name}</p>
            <p><b style="width: 140px; display: inline-block;">Email</b>: ${email}</p>
            <p><b style="width: 140px; display: inline-block;">Phone</b>: ${mobileNo}</p>
            <p><b style="width: 140px; display: inline-block;">Country</b>: ${country}</p>
            <p><b style="width: 140px; display: inline-block;">Selected Service</b>: ${service}</p>
            <b>Description</b>
            <p style="font-size: 14px; line-height: 20px;">${comment}</p>
            <p>Please reach out to the user at the earliest.</p>
            <b>Best Regards,</b>
            <a style="color: #000; background: #fff; text-decoration: auto; padding: 10px 20px; border-radius: 40px; margin-top: 15px; display: block; width: fit-content;" href="https://base2brand.com/" target="_blank">Visit site</a>
        </div>
    </div>
`;

// Create new Contact and send emails
exports.createContact = async (req, res) => {
  try {
    const { name, email, country, mobileNo, companyName, service, comment } =
      req.body;

    const ipAddress = getIPAddress();

    // Create a new contact using Sequelize
    const newContact = await Contact.create({
      name,
      email,
      country,
      mobileNo,
      companyName,
      service,
      comment,
      ipAddress,
    });

    // Send confirmation email to the user
    try {
      await sendEmail({
        to: email,
        subject: "Thank You for Contacting Us",
        html: usserContactHtml({ name, service }),
      });

      // Send notification email to the admin
      await sendEmail({
        to: "tech@base2brand.com", // Admin email address
        subject: "New Contact Us Message Received",
        html: adminContactHtml({
          name,
          email,
          mobileNo,
          country,
          service,
          comment,
        }),
      });

      // Respond with success message
      res.status(201).json({
        message: "Contact created successfully, emails sent",
        newContact,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      res.status(500).json({
        message: "Contact created, but one or more emails failed to send",
        newContact,
        emailError: emailError.message,
      });
    }
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

    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err) => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle general server errors
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all Contacts with pagination and default sorting (newest first)
exports.getContacts = async (req, res) => {
  try {
    // Get page and limit from query parameters, set default values if not provided
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

    // Default sorting behavior: Sort by 'createdAt' in descending order (newest first)
    const sortBy = req.query.sortBy || "createdAt"; // Default to sorting by 'createdAt'
    const order = req.query.order === "asc" ? 1 : -1; // Default to descending order (-1), for ascending use "asc"

    // Calculate the starting index for pagination
    const skip = (page - 1) * limit;

    // Retrieve contacts with pagination and sorting
    const contacts = await Contact.findAll({
      offset: skip,
      limit: limit,
      order: [[sortBy, order === 1 ? 'ASC' : 'DESC']],
    });

    // Get total count of contacts for pagination info
    const totalContacts = await Contact.count();

    res.status(200).json({
      message: "Contacts retrieved successfully",
      page,
      totalPages: Math.ceil(totalContacts / limit),
      totalContacts,
      contacts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

// Get a specific contact by ID
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.status(200).json({
      message: "Contact retrieved successfully",
      contact,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update a contact by ID
exports.updateContactById = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    await contact.update(req.body);

    res.status(200).json({
      message: "Contact updated successfully",
      contact,
    });
  } catch (error) {
    // Handle Sequelize validation errors
    if (error.name === "SequelizeValidationError") {
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

// Delete a contact by ID
exports.deleteContactById = async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    await contact.destroy();

    res.status(200).json({
      message: "Contact deleted successfully",
      contact,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Search Contacts with pagination, filters, and date range
exports.searchContacts = async (req, res) => {
  try {
    // Get the page, limit, query parameters, and date range from the request
    const { query, dateRange, page = 1, limit = 10 } = req.query;

    // Pagination setup
    const skip = (page - 1) * parseInt(limit);

    // Initialize where conditions
    const whereConditions = {};

    // Add query search across multiple fields if 'query' is provided
    if (query) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } },
        { country: { [Op.iLike]: `%${query}%` } },
        { service: { [Op.iLike]: `%${query}%` } },
        { mobileNo: { [Op.iLike]: `%${query}%` } },
      ];
    }

    // Add date range filter if 'dateRange' is provided
    if (dateRange) {
      const [startDateString, endDateString] = dateRange
        .split("to")
        .map((date) => date.trim());

      // Parse 'dd/mm/yyyy' into a valid Date object
      const parseDate = (dateString) => {
        const [day, month, year] = dateString.split("/").map(Number);
        return new Date(year, month - 1, day); // Month is zero-based
      };

      const startDate = parseDate(startDateString);
      const endDate = parseDate(endDateString);

      // Set the start of the day (00:00:00) for the start date
      startDate.setHours(0, 0, 0, 0);
      // Set the end of the day (23:59:59) for the end date
      endDate.setHours(23, 59, 59, 999);

      if (!isNaN(startDate) && !isNaN(endDate)) {
        whereConditions.createdAt = {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        };
      } else {
        return res.status(400).json({
          message: "Invalid date range format. Use 'dd/mm/yyyy to dd/mm/yyyy'.",
        });
      }
    }

    // Retrieve filtered contacts with pagination
    const contacts = await Contact.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']], // Sort by newest first
      offset: skip,
      limit: parseInt(limit),
    });

    // Get total count of filtered contacts for pagination info
    const totalContacts = await Contact.count({ where: whereConditions });

    res.status(200).json({
      message: "Contacts retrieved successfully",
      page: parseInt(page),
      totalPages: Math.ceil(totalContacts / limit),
      totalContacts,
      contacts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};
