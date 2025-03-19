const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.studentId = decoded.id;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};

// Fetch student details
router.get("/student-details", authenticateToken, async (req, res) => {
  try {
    const student = await pool.query(
      "SELECT name, email, password, bus_stop_id, course, phone_number, roll_no, route_no, year FROM students WHERE id = $1",
      [req.studentId]
    );

    if (student.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(student.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
