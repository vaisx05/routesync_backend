const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    console.error("❌ No token provided");
    return res.status(401).json({ error: "Access denied" });
  }

  try {
    const tokenWithoutBearer = token.split(" ")[1];
    console.log("🔑 Token Received:", tokenWithoutBearer);

    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    console.log("✅ Decoded Token:", decoded);

    req.studentId = decoded.id; // Extract the user ID from the token
    next();
  } catch (err) {
    console.error("❌ Token Verification Error:", err.message);
    res.status(403).json({ error: "Invalid token" });
  }
};

// Fetch student details
router.get("/student-details", authenticateToken, async (req, res) => {
  try {
    console.log("🔍 Fetching details for student ID:", req.studentId);

    const query = `
      SELECT 
        username AS name, 
        email_id AS email, 
        roll_no, 
        user_type, 
        created_at, 
        updated_at 
      FROM 
        Users 
      WHERE 
        user_id = $1 AND user_type = 'student';
    `;

    const student = await pool.query(query, [req.studentId]);
    console.log("📋 Query Result:", student.rows);

    if (student.rows.length === 0) {
      console.error("❌ Student not found");
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(student.rows[0]); // Return the student's details
  } catch (err) {
    console.error("❌ Server Error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
