// generate-photos.js
const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "photos");
const outputFile = path.join(__dirname, "photos.json");

const categories = ["cars", "landscapes", "buildings", "animals", "misc"];

let data = {};

categories.forEach(category => {
  const folder = path.join(baseDir, category);
  if (fs.existsSync(folder)) {
    const files = fs.readdirSync(folder)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort(); // keep them in order
    data[category] = files;
  } else {
    data[category] = [];
  }
});

fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
console.log("✅ photos.json generated successfully!");
