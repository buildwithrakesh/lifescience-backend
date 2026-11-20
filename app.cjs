// Startup file for cPanel "Setup Node.js App" (Phusion Passenger) on Hostycare.
// Passenger loads the startup file with require(), but server.js is an ES module ("type": "module"),
// so this small CommonJS file simply imports it. Locally / on Render, "npm start" (node server.js) is unchanged.
import("./server.js").catch((err) => {
  console.error("[Life Science API] Failed to start:", err);
  process.exit(1);
});
