import { parseString } from "xml2js";
import { LayerProps } from "../types";
import fs from "fs";

export function getSVGLayers(svgFilePath: string) {
  let layers: LayerProps[] = [];

  const data = fs.readFileSync(svgFilePath, "utf8");

  const stats = fs.statSync(svgFilePath);
  const fileSizeInMegaBytes = stats.size / 1000 / 1000;

  if (fileSizeInMegaBytes > 4) {
    console.log("File size is more than 4MB, parsing layers");
  }

  parseString(data, (err, result) => {
    if (err) {
      console.error("Error parsing SVG file:", err);
      return;
    }

    if (result.svg && result.svg.g) {
      result.svg.g.forEach((group: any) => {
        if (group.$ && group.$["inkscape:label"]) {
          const layerNumber = group.$["inkscape:label"].split("-")[0];
          const layerColor = group.$["inkscape:label"].split("-")[1];

          const hasValidLayers =
            layerNumber === "1" || layerNumber === "2" || layerNumber === "3" || layerNumber === "4";

          layers.push({ id: group.$["inkscape:label"], color: layerColor, number: layerNumber, valid: hasValidLayers });
        }
      });
    }

    if (layers.length === 0) {
      layers.push({ id: "no-layers", color: "none", number: "0", valid: false });
    }
  });

  return layers;
}
