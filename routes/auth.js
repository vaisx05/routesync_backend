const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// User Signup (Student, Admin, or Driver)
router.post("/signup", async (req, res) => {
  const { username, email_id, password, user_type, roll_no } = req.body;

  try {
    // Check if user already exists (Using INDEX on email_id)
    const userExists = await pool.query(
      "SELECT 1 FROM Users WHERE email_id = $1 LIMIT 1",
      [email_id]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user (Using INDEX on primary key)
    const newUser = await pool.query(
      `INSERT INTO Users (username, email_id, password_hash, user_type, roll_no) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, username, email_id, user_type, roll_no, created_at`,
      [username, email_id, hashedPassword, user_type, roll_no]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.rows[0].user_id, user_type },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// User Login
router.post("/login", async (req, res) => {
  const { email_id, password } = req.body;

  try {
    // Find user by email (Using INDEX on email_id)
    const user = await pool.query(
      "SELECT user_id, password_hash, user_type FROM Users WHERE email_id = $1",
      [email_id]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare passwords
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].user_id, user_type: user.rows[0].user_type },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Update last login time (Using INDEX on user_id for quick update)
    await pool.query("UPDATE Users SET last_login = NOW() WHERE user_id = $1", [
      user.rows[0].user_id,
    ]);

    res.json({ token, user: { id: user.rows[0].user_id, user_type: user.rows[0].user_type } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
