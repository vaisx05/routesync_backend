const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:5000"); // Connect to your WebSocket server

const route32 = [
  { latitude: 77.28154311779451, longitude: 10.995427607336936, stop_name: "Palladam" },
  { latitude: 77.12438300451487, longitude: 11.025574168674922, stop_name: "Sulur" },
  { latitude: 77.06815453044447, longitude: 11.005833179117772, stop_name: "Irugur" },
  { latitude: 77.03416378011872, longitude: 11.062216532747442, stop_name: "NGP" }
];

ws.on("open", () => {
  console.log("✅ Connected to WebSocket server!");
  
  let index = 0;

  // Send location updates every 3 seconds
  const interval = setInterval(() => {
    if (index < route32.length) {
      const data = JSON.stringify({
        id: 32, // Route number
        plate_no: "TNA1234",
        route_no: "Route 32",
        depart_location: route32[0].stop_name, // Start: Palladam
        latitude: route32[index].latitude,
        longitude: route32[index].longitude,
        stop_name: route32[index].stop_name
      });

      console.log(`📤 Sending location update: ${data}`);
      ws.send(data);
      index++;
    } else {
      clearInterval(interval);
      ws.close();
    }
  }, 3000);
});

ws.on("message", (message) => {
  console.log("📩 Received from server:", message);
});

ws.on("close", () => {
  console.log("❌ Connection closed");
});

ws.on("error", (error) => {
  console.error("🚨 WebSocket error:", error);
});
