import dotenv from "dotenv";

dotenv.config();

import { cleanup, initializeServices } from "./utils/service-initializer.js";

async function main() {
  let services: Awaited<ReturnType<typeof initializeServices>> | undefined;

  try {
    const { webDriver, mediaAnalysisService } = await initializeServices({
      vertexModel: "gemini-2.5-flash",
      gcloudBucketName: "ig-reels-recordings",
    });
  } catch (error) {
    console.error("❌ Analysis failed:", error);
  } finally {
    if (services) {
      await cleanup(services);
    }
  }
}

main().catch(console.error);
