const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const startBusRoutes = require("./routes/start-bus");
const { router: fetchLocationRoutes, initWebSocket } = require("./routes/fetch-location"); // Import WebSocket and routes
const authMiddleware = require("./middleware/authMiddleware");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app); // Create HTTP server instance

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", authMiddleware, studentRoutes); // Protected student routes
app.use("/api/driver", startBusRoutes);
app.use("/api", fetchLocationRoutes); // Add fetch-location routes

// Initialize WebSocket Server for fetch-location
initWebSocket(server);

// Start Express Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
