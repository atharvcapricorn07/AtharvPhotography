// generate-photos.js
const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "photos");
const outputFile = path.join(__dirname, "photos.json");

/**
 * Updated Categories:
 * Removed "buildings" per request.
 * "shoots" maps to "Portraits" in your Gallery UI.
 * "misc" added for general photography.
 */
const categories = ["cars", "landscapes", "animals", "misc", "awards", "shoots"];

let data = {};

categories.forEach(category => {
  const folder = path.join(baseDir, category);
  
  if (fs.existsSync(folder)) {
    const files = fs.readdirSync(folder)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort(); // Keeps filenames organized alphabetically or numerically
    
    data[category] = files;
  } else {
    // Creates an empty array if the folder doesn't exist to prevent site errors
    data[category] = [];
    console.warn(`⚠️  Warning: Folder not found: ${folder}`);
  }
});

try {
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
  console.log("✅ photos.json generated successfully!");
  console.log("Included categories:", categories.join(", "));
} catch (err) {
  console.error("❌ Error writing photos.json:", err);
}