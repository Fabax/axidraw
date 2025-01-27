import fs from "fs";
import { homedir } from "os";
import type { FileProps } from "../types";

export function getFiles(): FileProps[] {
  let resultFiles: FileProps[] = [];
  const files = fs.readdirSync(`${homedir}/Documents/Fabax-art/ReadyForPlot`);

  files.forEach((file) => {
    if (file.endsWith(".svg")) {
      const filePath = `${homedir}/Documents/Fabax-art/ReadyForPlot/${file}`;

      resultFiles.push({ id: file, path: filePath, name: file });
    }
  });

  return resultFiles;
}
