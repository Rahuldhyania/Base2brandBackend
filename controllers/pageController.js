const PageModel = require("../models/pagesModel");
const cloudinary = require("../config/cloudinaryConfig");
const fs = require("fs");
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

const uploadImage = async (file, folder = "pages") => {
  const result = await cloudinary.uploader.upload(file.path, { folder });
  fs.unlinkSync(file.path); // remove temp file
  return result.secure_url;
};

// Map multer files array to object keyed by fieldname
const mapFiles = (files) => {
  const filesMap = {};
  (files || []).forEach(file => {
    filesMap[file.fieldname] = file;
  });
  return filesMap;
};
// Create new page with all sections
exports.createPage = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Files:", req.files);

    // -------- Parse Payload --------
    let payload;
    try {
      payload = typeof req.body.createPagePayload === "string"
        ? JSON.parse(req.body.createPagePayload)
        : req.body.createPagePayload;

      if (!payload) {
        return res.status(400).json({ status: 400, message: "Payload is required" });
      }
    } catch (parseError) {
      console.error("Payload parsing error:", parseError);
      return res.status(400).json({ status: 400, message: "Invalid JSON payload" });
    }

    console.log("Parsed payload:", payload);

    const ipAddress = getIPAddress();

    // Check if pageName exists
    if (await PageModel.findOne({ where: { pageName: payload.pageName } })) {
      return res.status(409).json({ status: 409, message: "Page name already exists." });
    }

    // Check if pageSlug exists
    if (await PageModel.findOne({ where: { pageSlug: payload.pageSlug } })) {
      return res.status(409).json({ status: 409, message: "Page slug already exists." });
    }

    const filesMap = mapFiles(req.files);
    console.log("Mapped files:", Object.keys(filesMap));

    // Hero Section
    payload.heroSection = payload.heroSection || {};
    if (filesMap.heroBackground) {
      try {
        payload.heroSection.backgroundImage = await uploadImage(filesMap.heroBackground);
        console.log("Hero background uploaded");
      } catch (uploadError) {
        console.error("Hero background upload failed:", uploadError);
        // Remove the key if upload fails
        delete payload.heroSection.backgroundImage;
      }
    }

    if (filesMap.topImage) {
      try {
        payload.heroSection.topImage = await uploadImage(filesMap.topImage);
        console.log("Top image uploaded");
      } catch (uploadError) {
        console.error("Top image upload failed:", uploadError);
        // Remove the key if upload fails
        delete payload.heroSection.topImage;
      }
    }

    // About Section
    payload.aboutSection = payload.aboutSection || {};
    if (filesMap.aboutImage) {
      try {
        payload.aboutSection.image = await uploadImage(filesMap.aboutImage);
        console.log("About image uploaded");
      } catch (uploadError) {
        console.error("About image upload failed:", uploadError);
        // Remove the key if upload fails
        delete payload.aboutSection.image;
      }
    }

    // Challenges Section - Clean up empty tab_image fields
    payload.challengesSection = payload.challengesSection || { items: [] };

    if (payload.challengesSection.items?.length) {
      for (let i = 0; i < payload.challengesSection.items.length; i++) {
        const file = filesMap[`tab_image_${i}`];
        if (file) {
          try {
            const imageUrl = await uploadImage(file);
            if (imageUrl) {
              payload.challengesSection.items[i].tab_image = imageUrl;
              console.log(`Tab image ${i} uploaded`);
            }
          } catch (uploadError) {
            console.error(`Tab image ${i} upload failed:`, uploadError);
            // Remove tab_image key if upload fails
            if (payload.challengesSection.items[i]) {
              delete payload.challengesSection.items[i].tab_image;
            }
          }
        } else {
          // Remove tab_image key if no file was provided
          if (payload.challengesSection.items[i]) {
            delete payload.challengesSection.items[i].tab_image;
          }
        }
      }
    }

    // Clean up challenges items - remove empty objects and undefined fields
    if (payload.challengesSection.items) {
      payload.challengesSection.items = payload.challengesSection.items
        .filter(item => item && (item.heading || item.challenge || item.challenge_des || item.solution || item.solution_des || item.tab_image))
        .map(item => ensureChallengeItemShape(item));
    }

    let defaultChallenges = [
      {
        heading: '',
        challenge: '',
        solution: '',
        tab_image: '',
      },
    ];


    // Ensure all required sections have proper structure
    const pageData = {
      pageName: payload.pageName,
      pageSlug: payload.pageSlug,
      seoPageTitle: payload.seoPageTitle || '',
      pageKeywords: payload.pageKeywords || '',
      status: payload.status !== undefined ? payload.status : true,
      ipAddress: ipAddress,
      heroSection: cleanObject(payload.heroSection || {}),
      aboutSection: cleanObject(payload.aboutSection || {}),
      servicesSection: payload.servicesSection || { title: '', subtitle: '', services: [] },
      challengesSection: {
        title: payload.challengesSection?.title || '',
        subtitle: payload.challengesSection?.subtitle || '',
        items:
          Array.isArray(payload.challengesSection?.items) &&
            payload.challengesSection.items.length > 0
            ? payload.challengesSection.items
            : defaultChallenges,
      },
      processSection: payload.processSection || { title: '', subtitle: '', steps: [] },
      teamSection: payload.teamSection || { title: '', subtitle: '', members: [] },
      testimonialsSection: payload.testimonialsSection || { title: '', subtitle: '', testimonials: [] },
      faqSection: payload.faqSection || { title: '', subtitle: '', faqs: [] },
      contactSection: payload.contactSection || { title: '', subtitle: '', description: '', contactInfo: {}, ctaButton: {} },
      partnersSection: payload.partnersSection || { title: '', partners: [] }
    };

    console.log("Final page data to create:", JSON.stringify(pageData, null, 2));

    // Create Page
    const newPage = await PageModel.create(pageData);

    res.status(201).json({
      status: 201,
      message: "Page created successfully",
      data: newPage,
    });

  } catch (error) {
    console.error("Create Page Error:", error);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      status: 500,
      message: "Error creating page: " + (error.message || "Unknown error"),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to remove empty fields from objects
function cleanObject(obj) {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedValue = cleanObject(value);
        if (Object.keys(cleanedValue).length > 0) {
          cleaned[key] = cleanedValue;
        }
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          cleaned[key] = value;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// Normalize a challengesSection item to have required keys even if empty
function ensureChallengeItemShape(item) {
  const normalized = item || {};
  return {
    heading: normalized.heading || '',
    challenge: normalized.challenge || '',
    solution: normalized.solution || '',
    tab_image: normalized.tab_image || '',
  };
}

// Normalize a testimonials item
function ensureTestimonialItemShape(item) {
  const normalized = item || {};
  return {
    name: normalized.name || '',
    testimonial: normalized.testimonial || '',
  };
}

// Normalize a faq item
function ensureFaqItemShape(item) {
  const normalized = item || {};
  return {
    order: typeof normalized.order === 'number' ? normalized.order : undefined,
    question: normalized.question || '',
    answer: normalized.answer || '',
  };
}

// Convert an object with numeric keys into a sorted array
function numericKeyedObjectToArray(obj) {
  const keys = Object.keys(obj).filter(k => /^\d+$/.test(k)).sort((a,b)=>Number(a)-Number(b));
  return keys.map(k => obj[k]);
}

// Normalize existing stored testimonialsSection into desired object shape
function normalizeStoredTestimonialsSection(section) {
  if (!section) return { title: '', subtitle: '', testimonials: [] };
  // If already correct
  if (typeof section === 'object' && !Array.isArray(section) && Array.isArray(section.testimonials)) {
    return {
      title: section.title || '',
      subtitle: section.subtitle || '',
      testimonials: section.testimonials.map(ensureTestimonialItemShape),
    };
  }
  // If stored as numeric-keyed object
  if (typeof section === 'object' && !Array.isArray(section) && Object.keys(section).every(k => /^\d+$/.test(k))) {
    const arr = numericKeyedObjectToArray(section).map(ensureTestimonialItemShape);
    return { title: '', subtitle: '', testimonials: arr };
  }
  // If stored as array
  if (Array.isArray(section)) {
    return { title: '', subtitle: '', testimonials: section.map(ensureTestimonialItemShape) };
  }
  return { title: '', subtitle: '', testimonials: [] };
}

// Normalize existing stored faqSection into desired object shape
function normalizeStoredFaqSection(section) {
  if (!section) return { title: '', subtitle: '', faqs: [] };
  if (typeof section === 'object' && !Array.isArray(section) && Array.isArray(section.faqs)) {
    return {
      title: section.title || '',
      subtitle: section.subtitle || '',
      faqs: section.faqs.map(ensureFaqItemShape),
    };
  }
  if (typeof section === 'object' && !Array.isArray(section) && Object.keys(section).every(k => /^\d+$/.test(k))) {
    const arr = numericKeyedObjectToArray(section).map(ensureFaqItemShape);
    return { title: '', subtitle: '', faqs: arr };
  }
  if (Array.isArray(section)) {
    return { title: '', subtitle: '', faqs: section.map(ensureFaqItemShape) };
  }
  return { title: '', subtitle: '', faqs: [] };
}

// Remove numeric keys at root level of an object
function stripNumericKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const copy = { ...obj };
  Object.keys(copy).forEach(k => { if (/^\d+$/.test(k)) delete copy[k]; });
  return copy;
}

// -------------------- UPDATE PAGE --------------------



exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ status: 400, message: "Page ID is required" });
    }

    console.log("Updating page ID:", id);
    console.log("Request body:", req.body);
    console.log("Files:", req.files);

    // -------- Parse Payload --------
    let payload;
    try {
      payload = typeof req.body.updatePagePayload === "string"
        ? JSON.parse(req.body.updatePagePayload)
        : req.body.updatePagePayload;

      if (!payload) {
        return res.status(400).json({ status: 400, message: "Payload is required" });
      }
    } catch (parseError) {
      console.error("Payload parsing error:", parseError);
      return res.status(400).json({ status: 400, message: "Invalid JSON payload" });
    }

    console.log("Parsed payload:", payload);

    const filesMap = mapFiles(req.files);
    console.log("Mapped files:", Object.keys(filesMap));

    // -------- Find existing page --------
    const page = await PageModel.findByPk(id);
    if (!page) {
      return res.status(404).json({ status: 404, message: "Page not found" });
    }

    // Normalize existing stored sections before merging so DB can be corrected on save
    if (page.testimonialsSection) {
      page.testimonialsSection = normalizeStoredTestimonialsSection(page.testimonialsSection);
      page.changed("testimonialsSection", true);
    }
    if (page.faqSection) {
      page.faqSection = normalizeStoredFaqSection(page.faqSection);
      page.changed("faqSection", true);
    }

    // -------- Unique checks --------
    if (payload.pageName && payload.pageName !== page.pageName) {
      const existingPage = await PageModel.findOne({ where: { pageName: payload.pageName } });
      if (existingPage) {
        return res.status(409).json({ status: 409, message: "Page name already exists." });
      }
    }

    if (payload.pageSlug && payload.pageSlug !== page.pageSlug) {
      const existingPage = await PageModel.findOne({ where: { pageSlug: payload.pageSlug } });
      if (existingPage) {
        return res.status(409).json({ status: 409, message: "Page slug already exists." });
      }
    }

    // =========================
    // HERO SECTION
    // =========================
    if (!page.heroSection || typeof page.heroSection !== "object") {
      page.heroSection = {};
    }
    if (payload.heroSection) {
      const cleanedHero = cleanObject(payload.heroSection);
      if (Object.keys(cleanedHero).length > 0) {
        page.heroSection = { ...page.heroSection, ...cleanedHero };
      }
    }
    if (filesMap.heroBackground) {
      try {
        page.heroSection.backgroundImage = await uploadImage(filesMap.heroBackground);
        console.log("Hero background uploaded");
      } catch (uploadError) {
        console.error("Hero background upload failed:", uploadError);
        delete page.heroSection.backgroundImage;
      }
    }
    if (filesMap.topImage) {
      try {
        page.heroSection.topImage = await uploadImage(filesMap.topImage);
        console.log("Top image uploaded");
      } catch (uploadError) {
        console.error("Top image upload failed:", uploadError);
        delete page.heroSection.topImage;
      }
    }
    page.changed("heroSection", true);

    // =========================
    // ABOUT SECTION
    // =========================
    if (!page.aboutSection || typeof page.aboutSection !== "object") {
      page.aboutSection = {};
    }
    if (payload.aboutSection) {
      const cleanedAbout = cleanObject(payload.aboutSection);
      if (Object.keys(cleanedAbout).length > 0) {
        page.aboutSection = { ...page.aboutSection, ...cleanedAbout };
      }
    }
    if (filesMap.aboutImage) {
      try {
        page.aboutSection.image = await uploadImage(filesMap.aboutImage);
        console.log("About image uploaded");
      } catch (uploadError) {
        console.error("About image upload failed:", uploadError);
        delete page.aboutSection.image;
      }
    }
    page.changed("aboutSection", true);

    // =========================
    // CHALLENGES SECTION
    // =========================
if (!page.challengesSection || typeof page.challengesSection !== "object") {
  page.challengesSection = {};
}

// Merge payload
if (payload.challengesSection) {
  const cleanedChallengesSection = cleanObject(payload.challengesSection);
  if (Object.keys(cleanedChallengesSection).length > 0) {
    // Merge existing section with payload
    page.challengesSection = {
      ...page.challengesSection,
      ...cleanedChallengesSection,
    };
  }

  // --- Handle items ---

  // Tab images upload (agar filesMap me diye gaye ho)
  const itemsLength = Array.isArray(page.challengesSection.items) ? page.challengesSection.items.length : 0;
  for (let i = 0; i < itemsLength; i++) {
    const file = filesMap[`tab_image_${i}`];
    if (file) {
      try {
        const imageUrl = await uploadImage(file);
        if (!page.challengesSection.items[i]) page.challengesSection.items[i] = {};
        page.challengesSection.items[i].tab_image = imageUrl;
      } catch (uploadError) {
        console.error(`Tab image ${i} upload failed:`, uploadError);
        if (page.challengesSection.items[i]) delete page.challengesSection.items[i].tab_image;
      }
    }
  }

  // Clean up items (remove empty objects)
  if (Array.isArray(page.challengesSection.items)) {
    page.challengesSection.items = page.challengesSection.items
      .filter(item => item && (item.heading || item.challenge || item.challenge_des || item.solution || item.solution_des || item.tab_image))
      .map(item => ensureChallengeItemShape(cleanObject(item)));
  }
}
    page.changed("challengesSection", true);

    // =========================
    // PROCESS SECTION
    // =========================
    if (payload.processSection) {
      const cleanedProcess = cleanObject(payload.processSection);
      if (Object.keys(cleanedProcess).length > 0) {
        page.processSection = {
          ...(page.processSection || { title: '', subtitle: '', steps: [] }),
          ...cleanedProcess,
        };
        page.changed("processSection", true);
      }
    }

    // =========================
    // SERVICES SECTION
    // =========================
    if (payload.servicesSection) {
      const cleanedServices = cleanObject(payload.servicesSection);
      if (Object.keys(cleanedServices).length > 0) {
        page.servicesSection = {
          ...(page.servicesSection || { title: '', subtitle: '', services: [] }),
          ...cleanedServices,
        };
        page.changed("servicesSection", true);
      }
    }

    // =========================
    // TESTIMONIALS SECTION
    // =========================
    if (payload.testimonialsSection) {
      let incomingTestimonials = payload.testimonialsSection;

      // Handle direct array format from frontend: [{name, testimonial}, ...]
      if (Array.isArray(incomingTestimonials)) {
        incomingTestimonials = {
          title: page.testimonialsSection?.title || '',
          subtitle: page.testimonialsSection?.subtitle || '',
          testimonials: incomingTestimonials.map(item => ensureTestimonialItemShape(item))
        };
      }
      // Normalize numeric-keyed testimonials object into array
      else if (
        incomingTestimonials &&
        typeof incomingTestimonials === 'object' &&
        !('testimonials' in incomingTestimonials) &&
        Object.keys(incomingTestimonials).every(k => /^\d+$/.test(k))
      ) {
        const keys = Object.keys(incomingTestimonials).sort((a,b)=>Number(a)-Number(b));
        incomingTestimonials = {
          title: page.testimonialsSection?.title || '',
          subtitle: page.testimonialsSection?.subtitle || '',
          testimonials: keys.map(k => ensureTestimonialItemShape(incomingTestimonials[k]))
        };
      }

      // Strip any leftover numeric keys (avoid duplicates)
      incomingTestimonials = stripNumericKeys(incomingTestimonials);
      const cleanedTestimonials = cleanObject(incomingTestimonials);
      if (Object.keys(cleanedTestimonials).length > 0) {
        page.testimonialsSection = {
          ...(page.testimonialsSection || { title: '', subtitle: '', testimonials: [] }),
          ...cleanedTestimonials,
        };
        page.changed("testimonialsSection", true);
      }
    }

    // =========================
    // FAQ SECTION
    // =========================
    if (payload.faqSection) {
      let incomingFaq = payload.faqSection;
      // Normalize numeric-keyed object (e.g., form-data: faqSection[0]...)
      if (
        incomingFaq &&
        typeof incomingFaq === 'object' &&
        !Array.isArray(incomingFaq) &&
        !('title' in incomingFaq) &&
        !('subtitle' in incomingFaq) &&
        !('faqs' in incomingFaq)
      ) {
        const keys = Object.keys(incomingFaq);
        if (keys.length && keys.every(k => /^\d+$/.test(k))) {
          incomingFaq = { faqs: keys.sort((a,b)=>Number(a)-Number(b)).map(k => ensureFaqItemShape(incomingFaq[k])) };
        }
      }

      // Strip any leftover numeric keys (avoid duplicates)
      incomingFaq = stripNumericKeys(incomingFaq);
      const cleanedFaq = cleanObject(incomingFaq);
      if (Object.keys(cleanedFaq).length > 0) {
        page.faqSection = {
          ...(page.faqSection || { title: '', subtitle: '', faqs: [] }),
          ...cleanedFaq,
        };
        page.changed("faqSection", true);
      }
    }

    // =========================
    // TEAM SECTION
    // =========================
    if (payload.teamSection) {
      const cleanedTeam = cleanObject(payload.teamSection);
      if (Object.keys(cleanedTeam).length > 0) {
        page.teamSection = {
          ...(page.teamSection || { title: '', subtitle: '', members: [] }),
          ...cleanedTeam,
        };
        page.changed("teamSection", true);
      }
    }

    // =========================
    // CONTACT SECTION
    // =========================
    if (payload.contactSection) {
      const cleanedContact = cleanObject(payload.contactSection);
      if (Object.keys(cleanedContact).length > 0) {
        page.contactSection = {
          ...(page.contactSection || {
            title: '', subtitle: '', description: '',
            contactInfo: { email: '', phone: '', address: '', workingHours: '' },
            ctaButton: { text: '', link: '' }
          }),
          ...cleanedContact,
        };
        page.changed("contactSection", true);
      }
    }

    // =========================
    // PARTNERS SECTION
    // =========================
    if (payload.partnersSection) {
      const cleanedPartners = cleanObject(payload.partnersSection);
      if (Object.keys(cleanedPartners).length > 0) {
        page.partnersSection = {
          ...(page.partnersSection || { title: '', partners: [] }),
          ...cleanedPartners,
        };
        page.changed("partnersSection", true);
      }
    }

    // =========================
    // BASIC FIELDS
    // =========================
    if (payload.pageName) page.pageName = payload.pageName;
    if (payload.pageSlug) page.pageSlug = payload.pageSlug;
    if (payload.seoPageTitle) page.seoPageTitle = payload.seoPageTitle;
    if (payload.pageKeywords) page.pageKeywords = payload.pageKeywords;
    if (typeof payload.status !== "undefined") page.status = payload.status;

    // Do not clean untouched sections to preserve existing/default values

    // -------- Save --------
    console.log("Saving page:", {
      id: page.id,
      pageName: page.pageName,
      pageSlug: page.pageSlug,
    });

    await page.save();

    return res.status(200).json({
      status: 200,
      message: "Page updated successfully",
      data: page,
    });
  } catch (error) {
    console.error("Update Page Error:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      status: 500,
      message: "Error updating page: " + (error.message || "Unknown error"),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




// Get all pages with pagination
exports.getAllPages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    // const offset = (page - 1) * limit;

    const { count, rows: pages } = await PageModel.findAndCountAll({
      attributes: ['pageName', 'seoPageTitle', 'status', 'pageSlug', 'createdAt', 'id'],
      limit: limit,
      // offset: offset,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: 200,
      message: "Pages retrieved successfully",
      data: pages,
      pagination: {
        currentPage: page,
        totalPages,
        totalDocuments: count,
        pageSize: limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error retrieving pages: " + error.message,
    });
  }
};

// Get a specific page by ID
exports.getPageById = async (req, res) => {
  try {
    const { id } = req.params;
    const page = await PageModel.findByPk(id);

    if (!page) {
      return res.status(404).json({ status: 404, message: "Page not found" });
    }

    // Return normalized shapes for testimonials and faq without mutating DB
    const responsePage = page.toJSON();
    responsePage.testimonialsSection = normalizeStoredTestimonialsSection(responsePage.testimonialsSection);
    responsePage.faqSection = normalizeStoredFaqSection(responsePage.faqSection);

    res.status(200).json({
      status: 200,
      message: "Page retrieved successfully",
      data: responsePage,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error retrieving page: " + error.message,
    });
  }
};

// Get page by slug (NEW - Main function for frontend)
exports.getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Input validation
    if (!slug?.trim()) {
      return res.status(400).json({
        status: 400,
        message: "Page slug is required"
      });
    }

    // Optimized database query with selected fields only
    const page = await PageModel.findOne({
      where: {
        pageSlug: slug.trim().toLowerCase(),
        status: true
      },
      // Select only needed fields to reduce memory usage
      attributes: {
        exclude: ['createdAt', 'updatedAt'] // Exclude unnecessary fields
      }
    });

    if (!page) {
      return res.status(404).json({
        status: 404,
        message: "Page not found or inactive"
      });
    }

    // Transform data efficiently
    const responsePage = {
      ...page.toJSON(),
      testimonialsSection: normalizeStoredTestimonialsSection(page.testimonialsSection),
      faqSection: normalizeStoredFaqSection(page.faqSection)
    };

    return res.status(200).json({
      status: 200,
      message: "Page retrieved successfully",
      data: responsePage,
    });

  } catch (error) {
    // Log error for debugging (consider using a proper logger)
    console.error('Error in getPageBySlug:', error);
    
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};


// Delete a page
exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await PageModel.findByPk(id);
    if (!page) {
      return res.status(404).json({ status: 404, message: "Page not found" });
    }

    await page.destroy();

    res.status(200).json({ status: 200, message: "Page deleted successfully" });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Error deleting page: " + error.message,
    });
  }
};


// Get page by slug (NEW - Main function for frontend)
// exports.getPageBySlugKey = async (req, res) => {
//   try {
//     const { slug, key } = req.params;
//     // Direct query with only needed fields
//     const page = await PageModel.findOne({
//       where: { pageSlug: slug, status: true },
//       attributes: key === "info" 
//         ? ['id', 'pageName', 'pageSlug', 'seoPageTitle', 'pageKeywords', 'status', 'createdAt', 'updatedAt']
//         : ['id', key] // Only fetch the specific field needed
//     });
//     if (!page) {
//       return res.status(404).json("Page not found or inactive");
//     }
//     // Quick validation for allowed keys
//     const allowedKeys = ["info", "heroSection", "aboutSection", "challengesSection", 
//                         "processSection", "testimonialsSection", "faqSection"];
//     if (!allowedKeys.includes(key)) {
//       return res.status(400).json(`Invalid key '${key}'. Available keys are: ${allowedKeys.join(", ")}`);
//     }
//     // Direct response based on key
//     if (key === "info") {
//       return res.json(page);
//     }
//     return res.json(page[key]);
//   } catch (error) {
//     res.status(500).json("Error retrieving page: " + error.message);
//   }
// };



exports.getPageBySlugKey = async (req, res) => {
  try {
    const { slug, key } = req.params;
    // For heroSection, fetch only that specific field
    const page = await PageModel.findOne({
      where: { pageSlug: slug, status: true },
      attributes: key === "info"
        ? ['id', 'pageName', 'pageSlug', 'seoPageTitle', 'pageKeywords', 'status', 'createdAt', 'updatedAt']
        : ['id', key], // Only fetch the specific field
      raw: true // Get raw data, no Sequelize instance overhead
    });
    if (!page) {
      return res.status(404).json("Page not found or inactive");
    }
    const allowedKeys = ["info", "heroSection", "aboutSection", "challengesSection",
      "processSection", "testimonialsSection", "faqSection"];
    if (!allowedKeys.includes(key)) {
      return res.status(400).json(`Invalid key '${key}'. Available keys are: ${allowedKeys.join(", ")}`);
    }
    if (key === "info") {
      return res.json(page);
    }
    // Direct response - no extra processing
    let value = page[key];
    if (key === 'testimonialsSection') {
      value = normalizeStoredTestimonialsSection(value);
    } else if (key === 'faqSection') {
      value = normalizeStoredFaqSection(value);
    }
    return res.json(value);
  } catch (error) {
    res.status(500).json("Error retrieving page: " + error.message);
  }
};

