// run with: node tools/download_images.mjs
import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';

const root = process.cwd();
const outDir = path.join(root, "assets", "images");
const attrFile = path.join(root, "ATTRIBUTIONS.md");

async function fetchToFile(url, outPath) {
  const file = await fs.open(outPath, "w");
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const stream = res.pipe(file.createWriteStream());
      stream.on("finish", () => {
        file.close();
        resolve();
      });
      stream.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  try {
    const list = JSON.parse(await fs.readFile(path.join(root, "tools", "images.json"), "utf8"));
    await fs.mkdir(outDir, { recursive: true });

    const lines = [
      "# Image Attributions\n",
      "> All images stored in `assets/images/`. Licenses noted per source.\n"
    ];

    for (const item of list) {
      const dest = path.join(outDir, item.name);
      console.log(`Downloading ${item.url} to ${dest}...`);

      try {
        await fetchToFile(item.url, dest);
        console.log(`✓ Downloaded ${item.name}`);
      } catch (error) {
        console.error(`✗ Failed to download ${item.url}:`, error.message);
        continue;
      }

      // Minimal attribution text (source + license)
      let license = "See source page for license";
      if (item.url.includes("FractionCircles_Blank")) license = "CC0 (Public Domain)";
      if (item.url.includes("Place_values")) license = "CC BY-SA 4.0";
      if (item.url.includes("Skip_counting_on_a_number_line")) license = "CC0 (Public Domain)";
      if (item.url.includes("PerimeterRectangle")) license = "CC0 (Public Domain)";
      if (item.url.includes("Protractor")) license = "CC0 (Public Domain / OpenClipart)";
      if (item.url.includes("Long_division")) license = "CC BY-SA 4.0";
      if (item.url.includes("Grouped_Bar_Chart")) license = "CC BY-SA 3.0";
      if (item.url.includes("Measuring_-_Fractions_of_an_inch")) license = "Public Domain / CC0";

      lines.push(
        `- **${item.name}** — Source: ${item.url} — License: ${license} — Topic: ${item.topic}`
      );
    }

    await fs.writeFile(attrFile, lines.join("\n") + "\n", "utf8");
    console.log("✓ Images downloaded to assets/images/");
    console.log("✓ ATTRIBUTIONS.md written successfully");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();