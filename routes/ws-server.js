const WebSocket = require("ws");
const { Pool } = require("pg");

// Database Connection Pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "routesyncdb",
  password: "root",
  port: 5432,
});

// Function to initialize WebSocket server
const initWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  console.log("✅ WebSocket server is running!");

  wss.on("connection", (ws) => {
    console.log("🟢 Client connected");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        console.log("📩 Received Data:", data);

        // Map incoming fields to expected fields
        const bus_id = data.id;
        const latitude = data.latitude;
        const longitude = data.longitude;

        // Ensure required fields are present
        if (!bus_id || !latitude || !longitude) {
          console.error("❌ Missing required fields");
          ws.send(JSON.stringify({ error: "Missing required fields" }));
          return;
        }

        // Check if a row exists in gps_location for the given bus_id
        const locationCheck = await pool.query(
          "SELECT * FROM gps_location WHERE bus_id = $1",
          [bus_id]
        );

        let result;
        if (locationCheck.rows.length === 0) {
          // Insert a new row if it doesn't exist
          const insertQuery = `
            INSERT INTO gps_location (bus_id, latitude, longitude, timestamp)
            VALUES ($1, $2, $3, NOW())
            RETURNING *;
          `;
          result = await pool.query(insertQuery, [bus_id, latitude, longitude]);
          console.log("✅ New location inserted:", result.rows[0]);
        } else {
          // Update the existing row
          const updateQuery = `
            UPDATE gps_location
            SET latitude = $2, longitude = $3, timestamp = NOW()
            WHERE bus_id = $1
            RETURNING *;
          `;
          result = await pool.query(updateQuery, [bus_id, latitude, longitude]);
          console.log("✅ Location updated successfully:", result.rows[0]);
        }

        // Broadcast the update to all connected clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(result.rows[0]));
          }
        });
      } catch (error) {
        console.error("❌ Database Error:", error);
        ws.send(JSON.stringify({ error: "Internal server error" }));
      }
    });

    ws.on("close", () => {
      console.log("🔴 Client disconnected");
    });
  });
};

module.exports = initWebSocket;