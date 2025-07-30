const { spawn } = require("child_process");

console.log("Testing AOS installation...");

// Test 1: Check if AOS is available
try {
  const { execSync } = require("child_process");
  const version = execSync("aos --version", { encoding: 'utf8' });
  console.log("✅ AOS CLI is available:", version.trim());
} catch (error) {
  console.log("❌ AOS CLI not found:", error.message);
}

// Test 2: Try to start AOS process
console.log("\nTesting AOS process startup...");
const processId = "wPFoUrFZc0sVLw8EM1UyRnODPkaMeYpqoQltDq7zaZQ";

try {
  const aos = spawn("aos", ["--process", processId], { 
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  aos.stdout.on("data", (data) => {
    console.log("AOS OUT:", data.toString());
  });

  aos.stderr.on("data", (data) => {
    console.log("AOS ERR:", data.toString());
  });

  aos.on("error", (error) => {
    console.log("❌ AOS process error:", error.message);
  });

  aos.on("close", (code) => {
    console.log("AOS process closed with code:", code);
  });

  // Send a test command after 2 seconds
  setTimeout(() => {
    if (aos.stdin) {
      console.log("Sending test command to AOS...");
      aos.stdin.write(".load-blueprint token\n");
    }
  }, 2000);

  // Kill the process after 5 seconds
  setTimeout(() => {
    aos.kill();
    console.log("Test completed");
  }, 5000);

} catch (error) {
  console.log("❌ Failed to start AOS process:", error.message);
} 