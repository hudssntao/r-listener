import axios, { type AxiosResponse } from "axios";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

export class FileManager {
  async downloadTempFile(url: string, mime_type: string) {
    let response: AxiosResponse;
    try {
      response = await axios.get(url, {
        responseType: "arraybuffer",
      });
    } catch (e) {
      console.error(
        `FileManagerError: Could not download file with url ${url}: ${e}`,
      );
      return null;
    }

    const tempDir = os.tmpdir();
    const fileExtension = mime_type.split("/")[1] || "bin";
    const tempFilePath = path.join(
      tempDir,
      `file-${uuidv4()}.${fileExtension}`,
    );

    await fs.writeFile(tempFilePath, response.data);

    return tempFilePath;
  }

  async convertFileToBuffer(path: string) {
    const buffer = await fs.readFile(path);
    return buffer;
  }

  async deleteFile(path: string) {
    try {
      await fs.unlink(path);
    } catch (e) {
      console.error(
        `FileManagerError: Could not delete file with path ${path}: ${e}`,
      );
    }
  }
}