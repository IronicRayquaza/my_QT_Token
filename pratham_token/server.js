const express = require('express');
const path = require('path');
const WebSocket = require("ws");
const { spawn } = require("child_process");
const os = require("os");

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

// WebSocket server setup
const processId = "wPFoUrFZc0sVLw8EM1UyRnODPkaMeYpqoQltDq7zaZQ"; // Hardcoded process ID

// Find aos executable for Windows or Unix
function getAosExecutable() {
  if (os.platform() === "win32") {
    const appdata = process.env.APPDATA || "";
    const candidates = [
      path.join(appdata, "npm", "aos.cmd"),
      path.join(appdata, "npm", "aos.exe"),
      "aos",
      "aos.cmd",
      "aos.exe",
    ];
    return candidates.find((cmd) => true); // Just return the first, let spawn handle errors
  }
  // For Linux (Render), try multiple locations
  const candidates = [
    "aos",
    "./aos",
    "/usr/local/bin/aos",
    path.join(__dirname, "aos")
  ];
  return candidates.find((cmd) => true) || "aos"; // Default to "aos"
}

function jsObjToLuaTable(obj) {
  const escapeString = (str) => str.replace(/"/g, '\\"');
  const entries = Object.entries(obj).map(([key, value]) => {
    if (typeof value === "string") {
      return `${key} = "${escapeString(value)}"`;
    } else if (typeof value === "number" || typeof value === "boolean") {
      return `${key} = ${value}`;
    } else if (typeof value === "object") {
      return `${key} = ${jsObjToLuaTable(value)}`;
    } else {
      return `${key} = nil`; // unsupported type
    }
  });
  return `{ ${entries.join(", ")} }`;
}

const aosCmd = getAosExecutable();
const aosArgs = ["--process", processId];

console.log(`Starting persistent aos process: ${aosCmd} ${aosArgs.join(" ")}`);
let aos = null;

try {
  aos = spawn(aosCmd, aosArgs, { shell: true });

  aos.stdout.on("data", (data) => {
    console.log("AOS OUT:", data.toString());
  });

  aos.stderr.on("data", (data) => {
    console.error("AOS ERR:", data.toString());
  });

  aos.on("error", (error) => {
    console.error("Failed to start aos process:", error);
    console.log("AOS CLI not available, using fallback mode");
  });

  aos.on("close", (code) => {
    console.error("AOS process exited with code", code);
  });
} catch (error) {
  console.error("Failed to spawn aos process:", error);
  console.log("AOS CLI not available, using fallback mode");
}

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  // --- THIS IS THE CRITICAL PART: Listen for output from aos ---
  const dataHandler = (data) => {
    const text = data.toString();
    console.log(`Received from aos: ${text}`);

    // Add filters here — only forward if message contains relevant status
    const importantKeywords = [
      "success",
      "successful",
      "minted",
      "burned",
      "error",
      "failed",
    ];
    const matched = importantKeywords.some((keyword) =>
      text.toLowerCase().includes(keyword)
    );

    if (matched) {
      ws.send(JSON.stringify({ type: "aos-output", data: text }));
    } else {
      // Optional: log but don't send
      console.log("Ignored non-critical output.");
    }
  };
  
  if (aos) {
    aos.stdout.on("data", dataHandler);
    aos.stderr.on("data", dataHandler);
  }
  ws.on("message", (message) => {
    try {
      const { aosMessage } = JSON.parse(message);
      
      if (!aos) {
        // AOS not available, send mock response
        const mockResponse = {
          type: "aos-output",
          data: `Mock response: ${aosMessage} (AOS CLI not available in this environment)`
        };
        ws.send(JSON.stringify(mockResponse));
        console.log("Sent mock response:", mockResponse);
        return;
      }
      
      if (typeof aosMessage === "string") {
        aos.stdin.write(aosMessage + "\n");
        console.log("Sent to aos:", aosMessage);
      } else if (typeof aosMessage === "object") {
        // Fallback: convert object to Lua table and wrap in Send
        if (!("Target" in aosMessage)) {
          aosMessage.Target = "ao.id";
        }
        const luaTable = jsObjToLuaTable(aosMessage);
        const luaSend = `Send(${luaTable})\n`;
        aos.stdin.write(luaSend);
        console.log("Sent to aos:", luaSend.trim());
      } else {
        ws.send(
          JSON.stringify({ error: "aosMessage must be a string or object" })
        );
      }
    } catch (err) {
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  });
  ws.on("close", () => {
    console.log("Client disconnected");
    // Important: Remove the listeners to prevent memory leaks if you have many connections
    if (aos) {
      aos.stdout.removeListener("data", dataHandler);
      aos.stderr.removeListener("data", dataHandler);
    }
  });
});

console.log("WebSocket server running on ws://localhost:" + PORT); 