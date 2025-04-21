import fs from "fs-extra"
import path from "path"
import { JSDOM } from "jsdom"
import { index as defaultIndex } from "../components/svg.js"

// Folder setup
const mainFolders = ["../public/svg/fontawesome", "../public/svg/lucide", "../public/svg/foundry"];
const exclusiveFolders = ["../public/svg/lancer", "../public/svg/fallout"];
const outputMainFolder = "../public/svg/main";
const indexOutputDir = "../public/svg";
const defaultOutputFolder = "../public/svg/default";

// Utility: clean SVG using jsdom
function cleanSVG(svgContent, inputFolder) {
  svgContent = svgContent.replace(/<\?xml[^>]*\?>\s*/g, ""); // Remove XML declaration
  svgContent = svgContent.replace(/<!--[\s\S]*?-->/g, "");    // Remove comments

  const dom = new JSDOM(svgContent, { contentType: "image/svg+xml" });
  const document = dom.window.document;
  const svg = document.querySelector("svg");

  if (!svg) throw new Error("Invalid SVG file")

  const folderName = path.basename(inputFolder)
  if (folderName === "fallout") {
    // If there's no viewBox, try to add it from width/height
    if (!svg.hasAttribute("viewBox")) {
      const width = svg.getAttribute("width");
      const height = svg.getAttribute("height");

      if (width && height) {
        const parseUnit = (value) => parseFloat(value.replace(/[^0-9.]/g, "") || "0");
        const w = parseUnit(width);
        const h = parseUnit(height);
        if (w && h) {
          svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        }
      } else {
        console.log("ERR: expected width and height when adding viewBox")
      }
    }
  }

  svg.removeAttribute("width");
  svg.removeAttribute("height");

  // Clean the <svg> element itself
  if (svg.getAttribute("fill") === "currentColor") {
    svg.removeAttribute("fill");
  }
  if (svg.getAttribute("stroke") === "currentColor") {
    svg.removeAttribute("stroke");
  }
  if (svg.hasAttribute("style")) {
    svg.removeAttribute("style");
  }

  // Clean children
  const elements = [...svg.querySelectorAll("*")];
  elements.forEach((el) => {
    if (el.getAttribute("fill") === "currentColor") el.removeAttribute("fill");
    if (el.getAttribute("stroke") === "currentColor") el.removeAttribute("stroke");
    if (el.hasAttribute("style")) el.removeAttribute("style")
    if (folderName === "fallout") {
      el.removeAttribute("stroke", "white")
    }
  });

  // Force fill="white" and stroke="white" on root <svg>
  if (svg.getAttribute("fill") !== "none") {
    svg.setAttribute("fill", "white");
  }
  if (folderName !== "fallout") {
    svg.setAttribute("stroke", "white");
  }

  return svg.outerHTML;
}

// Process a folder of SVGs
async function processFolder(inputFolder, outputFolder = null, writeNamedIndex = null, prefix = "") {
  const files = await fs.readdir(inputFolder);
  const iconNames = [];

  for (const file of files) {
    if (path.extname(file) !== ".svg") continue;

    const inputPath = path.join(inputFolder, file);
    const svgContent = await fs.readFile(inputPath, "utf-8");

    try {
      const cleaned = cleanSVG(svgContent, inputFolder);

      const outFolder = outputFolder || inputFolder;
      const baseName = path.basename(file, ".svg");
      const prefixedName = prefix ? `${prefix}-${baseName}` : baseName;
      const outPath = path.join(outFolder, `${prefixedName}.svg`);

      await fs.ensureDir(outFolder);
      await fs.writeFile(outPath, cleaned, "utf-8");

      iconNames.push(prefixedName);
    } catch (err) {
      console.error(`✖ Failed: ${inputPath}\n${err.message}`);
    }
  }

  if (writeNamedIndex) {
    const fileName = path.basename(writeNamedIndex) + ".json";
    const indexPath = path.join(indexOutputDir, fileName);
    await fs.writeJson(indexPath, iconNames.sort(), { spaces: 2 });
    console.log(`📝 Wrote index: ${indexPath}`);
  }
}

// Main run
(async () => {
  for (const folder of exclusiveFolders) {
    const folderName = path.basename(folder);
    await processFolder(folder, null, folderName); // In-place with named index
  }

  await fs.emptyDir(outputMainFolder); // Clear output before writing
  for (const folder of mainFolders) {
    const prefix = path.basename(folder); // e.g., "lucide"
    await processFolder(folder, outputMainFolder, null, prefix);
  }

  await processFolder(outputMainFolder, outputMainFolder, "main"); // Write `main.json` index

  // ✅ New: Copy selected default icons into ../public/svg/default
  await fs.ensureDir(defaultOutputFolder);
  console.log()
  for (const [name, relPath] of Object.entries(defaultIndex)) {
    try {
      const svgContent = await fs.readFile(relPath, "utf-8")
      const cleaned = cleanSVG(svgContent, path.dirname(relPath))
      const outPath = path.join(defaultOutputFolder, `${name}.svg`);
      await fs.writeFile(outPath, cleaned, "utf-8");
    } catch (err) {
      console.error(`✖ Failed to process default icon "${name}":\n${err.message}`);
    }
  }

  console.log("🎉 SVG processing complete.");
})();
