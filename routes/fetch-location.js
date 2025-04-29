const express = require("express");
const WebSocket = require("ws");
const router = express.Router();
const { Pool } = require("pg");

// Database Connection Pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "routesyncdb",
  password: "root",
  port: 5432,
});

// Fetch all bus locations (HTTP Endpoint)
router.get("/locations", async (req, res) => {
  try {
    const query = `
      SELECT bus_id, latitude, longitude, timestamp
      FROM gps_location
      ORDER BY timestamp DESC;
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No location data found" });
    }

    res.json(result.rows); // Return all bus locations
  } catch (err) {
    console.error("❌ Error fetching locations:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch location for a specific bus (HTTP Endpoint)
router.get("/locations/:bus_id", async (req, res) => {
  const { bus_id } = req.params;

  try {
    const query = `
      SELECT bus_id, latitude, longitude, timestamp
      FROM gps_location
      WHERE bus_id = $1
      ORDER BY timestamp DESC
      LIMIT 1;
    `;
    const result = await pool.query(query, [bus_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No location data found for bus_id ${bus_id}` });
    }

    res.json(result.rows[0]); // Return the latest location for the specific bus
  } catch (err) {
    console.error("❌ Error fetching location for bus_id:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// WebSocket Functionality
const initWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  console.log("✅ WebSocket server for fetch-location is running!");

  wss.on("connection", async (ws) => {
    console.log("🟢 Client connected to fetch-location WebSocket");

    // Send all bus locations when a client connects
    try {
      const query = `
        SELECT bus_id, latitude, longitude, timestamp
        FROM gps_location
        ORDER BY timestamp DESC;
      `;
      const result = await pool.query(query);

      ws.send(JSON.stringify({ type: "all_locations", data: result.rows }));
    } catch (err) {
      console.error("❌ Error fetching initial locations:", err.message);
      ws.send(JSON.stringify({ error: "Error fetching initial locations" }));
    }

    // Handle incoming messages from clients
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === "fetch_location" && data.bus_id) {
          // Fetch location for a specific bus
          const query = `
            SELECT bus_id, latitude, longitude, timestamp
            FROM gps_location
            WHERE bus_id = $1
            ORDER BY timestamp DESC
            LIMIT 1;
          `;
          const result = await pool.query(query, [data.bus_id]);

          if (result.rows.length === 0) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: `No location data found for bus_id ${data.bus_id}`,
              })
            );
          } else {
            ws.send(
              JSON.stringify({ type: "bus_location", data: result.rows[0] })
            );
          }
        }
      } catch (err) {
        console.error("❌ Error processing WebSocket message:", err.message);
        ws.send(JSON.stringify({ error: "Internal server error" }));
      }
    });

    ws.on("close", () => {
      console.log("🔴 Client disconnected from fetch-location WebSocket");
    });
  });
};

module.exports = { router, initWebSocket };