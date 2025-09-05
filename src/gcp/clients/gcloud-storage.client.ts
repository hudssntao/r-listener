import { type Bucket, Storage } from "@google-cloud/storage";
import axios from "axios";
import type { CredentialBody } from "google-auth-library";

const buckets = ["ig-reels-recordings"] as const;
type BucketName = (typeof buckets)[number];

export class GCloudStorageClient {
  private storage: Storage;
  private bucket_name: BucketName;
  private bucket: Bucket;

  constructor(bucket_name: BucketName, credentials: CredentialBody) {
    this.storage = new Storage({
      projectId: process.env["GCP_PROJECT_ID"],
      credentials: credentials,
    });
    this.bucket_name = bucket_name;
    this.bucket = this.storage.bucket(bucket_name);
  }

  async uploadFileFromUrl(url: string, destination: string) {
    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
      });

      const file = this.bucket.file(destination);
      const writeStream = file.createWriteStream();

      response.data.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      const cloud_storage_url = `gs://${this.bucket_name}/${destination}`;
      return cloud_storage_url;
    } catch (error) {
      console.error("[GCloudStorageClient]: Failed to upload file from URL", {
        data: { url, destination },
        cause: error,
      });
      return;
    }
  }

  async uploadLocalFile(filePath: string, destination: string) {
    try {
      await this.bucket.upload(filePath, {
        destination,
      });

      const cloud_storage_url = `gs://${this.bucket_name}/${destination}`;
      return cloud_storage_url;
    } catch (error) {
      console.error("[GCloudStorageClient]: Failed to upload local file", {
        data: { filePath, destination },
        cause: error,
      });
      return;
    }
  }

  getPublicUrlFromUri(uri: string) {
    const publicUrl = uri.replace("gs://", "https://storage.googleapis.com/");
    return publicUrl;
  }
}
