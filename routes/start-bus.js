const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

router.post("/start-bus", async (req, res) => {
  const { bus_number, route_number, driver_id, capacity } = req.body; // Add capacity to the request body

  try {
    // Insert bus and route data into the database
    const result = await pool.query(
      `INSERT INTO Buses (bus_number, route_id, status, capacity) 
       VALUES ($1, (SELECT route_id FROM Routes WHERE route_name = $2), 'in_use', $3) 
       RETURNING *`,
      [bus_number, route_number, capacity] // Include capacity in the query parameters
    );

    // Update driver status to 'in_use'
    await pool.query(
      `UPDATE Drivers SET status = 'in_use' WHERE driver_id = $1`,
      [driver_id]
    );

    // Send bus start status using WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ bus_number, route_number, status: 'started' }));
      }
    });

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;