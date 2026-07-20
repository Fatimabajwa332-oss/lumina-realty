const mysql = require('mysql2');
require('dotenv').config();

// Using a connection POOL instead of a single connection.
// A pool automatically opens new connections as needed and recovers
// from a dropped connection instead of crashing the whole server.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Quick test on startup to confirm we can actually reach the database
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL database: lumina_realty');
  connection.release();
});

module.exports = pool;