const WebSocket = require("ws");
const { Pool } = require("pg");

// Database Connection Pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "routesyncdb",
  password: "2004",
  port: 5432,
});

module.exports = (server) => {
  const wss = new WebSocket.Server({ server });

  console.log("✅ WebSocket server is running!");

  wss.on("connection", (ws) => {
    console.log("🟢 Client connected");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        console.log("📩 Received Data:", data);

        // Ensure required fields are present
        if (!data.bus_id || !data.latitude || !data.longitude) {
          console.error("❌ Missing required fields");
          ws.send(JSON.stringify({ error: "Missing required fields" }));
          return;
        }

        // Check if bus exists
        const busCheck = await pool.query(
          "SELECT * FROM buses WHERE bus_id = $1",
          [data.bus_id]
        );

        if (busCheck.rows.length === 0) {
          console.error("❌ Bus ID not found");
          ws.send(JSON.stringify({ error: "Invalid bus ID" }));
          return;
        }

        // Insert into GPS_Location Table
        const query = `
          INSERT INTO gps_location (bus_id, latitude, longitude) 
          VALUES ($1, $2, $3)
          RETURNING *;
        `;

        console.log("Executing query:", query);
        console.log("With parameters:", [data.bus_id, data.latitude, data.longitude]);

        const result = await pool.query(query, [
          data.bus_id,
          data.latitude,
          data.longitude,
        ]);

        console.log("✅ Database updated successfully:", result.rows[0]);

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