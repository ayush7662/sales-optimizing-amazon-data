// backend/config/db.js
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'salesduo',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

const ListingRun = sequelize.define(
  'ListingRun',
  {
    asin: { type: DataTypes.STRING(20), allowNull: false },
    original: { type: DataTypes.JSON, allowNull: false },
    optimized: { type: DataTypes.JSON, allowNull: false },
    model: { type: DataTypes.STRING(64), allowNull: false },
    promptHash: { type: DataTypes.STRING(64), allowNull: false },
    durationMs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    source: { type: DataTypes.STRING(128), allowNull: true }, // scrape source
    mock: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    summary: { type: DataTypes.JSON, allowNull: true }, // improvement summary
    error: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    indexes: [{ fields: ['asin', 'createdAt'] }, { fields: ['createdAt'] }],
  }
);

module.exports = { sequelize, ListingRun };
