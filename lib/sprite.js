// https://github.com/mapbox/spritezero
// import spritezero from '@elastic/spritezero'
import spritezero from '@mapbox/spritezero'
import fs from 'fs';
import glob from 'glob';
import path from 'path'
import { JSDOM } from 'jsdom'

const flatFolderPath = path.resolve(path.join(process.cwd(), '../public/svg/flat'));
if (!fs.existsSync(flatFolderPath)) {
  fs.mkdirSync(flatFolderPath, { recursive: true });
}

var svgPaths = [
  // '../public/svg/default/*.svg',
  '../public/svg/fallout/*.svg',
  '../public/svg/lancer/*.svg',
  // '../public/svg/main/*.svg'
];

svgPaths.forEach(svgPath => {
  const files = glob.sync(path.resolve(path.join(process.cwd(), svgPath)));
  files.forEach(file => {
    const fileName = path.basename(file);
    const destPath = path.join(flatFolderPath, fileName);
    fs.copyFileSync(file, destPath);
  });
});

[20].forEach(function (pxRatio) {
  var svgs = glob.sync(path.resolve(path.join(process.cwd(), '../public/svg/flat/*.svg')))
    .map(function (f) {
      const content = fs.readFileSync(f)
      const svgContent = content.toString();
      const updatedSvgContent = svgContent.replace(/<svg([^>]*?)>/, '<svg$1 width="19" height="19">')

      const dom = new JSDOM(updatedSvgContent)
      const svg = dom.window.document.querySelector('svg');
      if (!svg) {
        console.log("ERR: malformed svg", updatedSvgContent)
      }

      // a few svgs want it on the path instead of root svg tag
      if (f.includes("sector.svg") || f.includes("hyperspace.svg")) {
        const paths = svg.querySelectorAll('path');
        paths.forEach((path) => {
          // path.setAttribute('fill', 'white');
        });
      }

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
        el.removeAttribute("fill")
        el.removeAttribute("stroke")
        if (el.getAttribute("fill") === "currentColor") el.removeAttribute("fill");
        if (el.getAttribute("stroke") === "currentColor") el.removeAttribute("stroke");
        if (el.hasAttribute("style")) el.removeAttribute("style");
        if (path.basename(f).includes("fallout")) {
          el.removeAttribute("stroke", "white");
        }
      });

      // Force fill="white" and stroke="white" on root <svg>
      // if (svg.getAttribute("fill") !== "none") {
      //   svg.setAttribute("fill", "white");
      // }
      // if (!path.basename(f).includes("fallout")) {
      //   svg.setAttribute("stroke", "white");
      // }

      const updatedSvgContentFinal = svg.outerHTML

      const buffer = Buffer.from(updatedSvgContentFinal)

      // console.log(updatedSvgContentFinal)
      return {
        svg: buffer,
        id: path.basename(f).replace('.svg', '')
      };
    });
  // console.log(svgs, "svgs")
  // return
  var pngPath = path.resolve(path.join(process.cwd(), '../public/svg/spritesheet.png'));
  var jsonPath = path.resolve(path.join(process.cwd(), '../public/svg/spritesheet.json'));

  // Pass `true` in the layout parameter to generate a data layout
  // suitable for exporting to a JSON sprite manifest file.
  spritezero.generateLayout({ imgs: svgs, pixelRatio: pxRatio, format: true, sdf: true }, function (err, dataLayout) {
    if (err) {
      console.log(err)
      return
    }

    // not sure why i need to do this manually, seems like a bug
    // but this is needed to allow for icon-color to work
    // https://github.com/mapbox/mapbox-gl-js/issues/3605
    for (var i in dataLayout) {
      dataLayout[i].sdf = true;
    }

    fs.writeFileSync(jsonPath, JSON.stringify(dataLayout));

    const newJsonPath = path.resolve(path.join(process.cwd(), '../public/svg/spritesheet@2x.json'));

    fs.copyFileSync(jsonPath, newJsonPath);
  });

  // Pass `false` in the layout parameter to generate an image layout
  // suitable for exporting to a PNG sprite image file.
  // maxIconSize: ""
  spritezero.generateLayout({ imgs: svgs, pixelRatio: pxRatio, format: false, sdf: true, }, function (err, imageLayout) {
    spritezero.generateImage(imageLayout, function (err, image) {
      if (err) {
        console.log(err)
        return
      }
      fs.writeFileSync(pngPath, image)

      const newPngPath = path.resolve(path.join(process.cwd(), '../public/svg/spritesheet@2x.png'));

      fs.copyFileSync(pngPath, newPngPath);
    });
  })
});


fs.rmSync(flatFolderPath, { recursive: true, force: true })
