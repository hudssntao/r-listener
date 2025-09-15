import { runConfig } from "./config.js";
import { cleanup, initializeServices } from "./utils/service-initializer.js";

async function main() {
  let services: Awaited<ReturnType<typeof initializeServices>> | undefined;

  try {
    services = await initializeServices({
      vertexModel: "gemini-2.5-flash",
      gcloudBucketName: "ig-reels-recordings",
    });

    const { instagramCrawler } = services;

    await instagramCrawler.crawl(runConfig.startingUsername);
  } catch (error) {
    console.error("❌ Analysis failed:", error);
  } finally {
    if (services) {
      console.log("🧹 Cleaning up services...");
      await cleanup(services);
    }
  }
}

main().catch(console.error);
