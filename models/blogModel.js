const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// const Blog = sequelize.define("Blog", {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true,
//   },
//   imageUrl: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   heading: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   description: {
//     type: DataTypes.TEXT,
//     allowNull: false,
//   },
//   pageTitle: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   pageDescription: {
//     type: DataTypes.TEXT,
//     allowNull: false,
//   },
//   pageUrl: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   slugUrl: {
//     type: DataTypes.STRING,
//     allowNull: false,
//     unique: true,
//   },
//   status: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false,
//   },
//   ipAddress: {
//     type: DataTypes.STRING,
//     allowNull: true,
//   },
// }, {
//   timestamps: true,
//   tableName: "blogs",
// });

// module.exports = Blog;




const Blog = sequelize.define("Blog", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  imageUrl: {
    type: DataTypes.TEXT, // changed
    allowNull: false,
  },
  heading: {
    type: DataTypes.TEXT, // changed
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  pageTitle: {
    type: DataTypes.TEXT, // changed
    allowNull: false,
  },
  pageDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  pageUrl: {
    type: DataTypes.TEXT, // changed
    allowNull: false,
  },
  slugUrl: {
    type: DataTypes.TEXT, // changed
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: "blogs",
});



module.exports = Blog;
