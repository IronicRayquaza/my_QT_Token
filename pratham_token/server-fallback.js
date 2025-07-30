const express = require('express');
const path = require('path');
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'test/dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'test/dist', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// WebSocket server setup (without AOS)
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    try {
      const { aosMessage } = JSON.parse(message);
      
      // Send back a mock response for testing
      const mockResponse = {
        type: "aos-output",
        data: `Mock response: ${aosMessage} (AOS CLI not available in this environment)`
      };
      
      ws.send(JSON.stringify(mockResponse));
      console.log("Sent mock response:", mockResponse);
      
    } catch (err) {
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  });
  
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket server running on ws://localhost:" + PORT);
console.log("Note: This is a fallback server without AOS CLI functionality"); 