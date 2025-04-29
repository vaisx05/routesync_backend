const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    console.error("❌ No token provided");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const tokenWithoutBearer = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    console.log("🔑 Token Received:", tokenWithoutBearer);

    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    console.log("✅ Decoded Token:", decoded);

    req.user = decoded; // Attach user info to the request
    next();
  } catch (err) {
    console.error("❌ Token Verification Error:", err.message);
    res.status(400).json({ error: "Invalid token!!" });
  }
};
