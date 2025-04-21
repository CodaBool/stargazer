const fs = require('fs');

// Load the GeoJSON file
const filePath = './south.json'; // Adjust path as needed
const outputPath = './south-fix.json'

const LAYER_NAME = "southern_countries"
const PRESERVE_PROPS = ["NAME_EN"];

fs.readFile(filePath, 'utf8', (error, data) => {
  if (error) {
    console.error('Error reading file:', error);
    return;
  }

  try {
    const topojson = JSON.parse(data);

    if (topojson.objects && topojson.objects[LAYER_NAME] && topojson.objects[LAYER_NAME].geometries) {
      topojson.objects[LAYER_NAME].geometries.forEach(geometry => {
        if (geometry.properties) {
          Object.keys(geometry.properties).forEach(key => {
            if (!PRESERVE_PROPS.includes(key)) {
              delete geometry.properties[key];
            }
          });
        }
      });
    }

    fs.writeFile(outputPath, JSON.stringify(topojson), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing file:', writeErr);
      } else {
        console.log('File has been saved to', outputPath);
      }
    });



  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
  }
});
