const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");


const PageModel = sequelize.define("PageModel", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Basic info
  pageName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pageSlug: {
    type: DataTypes.STRING,
    allowNull: true, // not required
    unique: true,
    set(value) {
      // If user gives slug → clean + set
      if (value && value.trim() !== "") {
        const slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        this.setDataValue("pageSlug", slug);
        return;
      }
  
      // If slug not provided → auto-generate from pageName
      if (this.pageName) {
        const slug = this.pageName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        this.setDataValue("pageSlug", slug);
      }
    },
  },  
  seoPageTitle: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  pageKeywords: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  // Hero Section (stored as JSON)
  heroSection: {
    type: DataTypes.JSONB,
    defaultValue: {
      title: '',
      subtitle: '',
      description: '',
      backgroundImage: '',
      topImage: '',
    },
  },

  // About Section (stored as JSON)
  aboutSection: {
    type: DataTypes.JSONB,
    defaultValue: {
      title: '',
      description: '',
      image: '',
    },
  },

  // Challenges Section (stored as JSON)
  challengesSection: {
    type: DataTypes.JSONB,
    defaultValue: {
      title: '',
      description: '',
      items: [
          {
            heading: "",
            challenge: "",
            solution: "",
            tab_image: "",
          },
        ],
    },
  },

  // Process Section (stored as JSON)
  processSection: {
    type: DataTypes.JSONB,
    defaultValue: {
      title: '',
      subtitle: '',
      steps: [
          {
            title: "",
            description: "",
          },
        ],
    },
  },

  // Testimonials Section (stored as JSON array)
  testimonialsSection: {
    type: DataTypes.JSONB,
   defaultValue: [
    {
      name: '',
      testimonial: '',
    },
  ],
  },

  // FAQ Section (stored as JSON array)
  faqSection: {
  type: DataTypes.JSONB,
  defaultValue: [
    {
      question: '',
      answer: '',
    },
  ],
},

}, {
  timestamps: true,
  tableName: "pages",
  indexes: [
    {
      fields: ['pageSlug']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = PageModel;
