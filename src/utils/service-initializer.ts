import { GoogleAuth } from "google-auth-library";
import { remote } from "webdriverio";
import { PrismaClient } from "../../generated/prisma/index.js";
import { MediaAnalysisService } from "../analysis/services/media-analysis.service.js";
import { InstagramCrawler } from "../automation/instagram.crawler.js";
import { EnhancedActionsService } from "../automation/services/enhanced-actions.service.js";
import { wdOpts } from "../config.js";
import { AccountDao } from "../db/dao/account.dao.js";
import { CommentDao } from "../db/dao/comment.dao.js";
import { InfluencerDao } from "../db/dao/influencer.dao.js";
import { ReelDao } from "../db/dao/reel.dao.js";
import { RestaurantDao } from "../db/dao/restaurant.dao.js";
import { AccountService } from "../db/services/account.service.js";
import { ReelsService } from "../db/services/reels.service.js";
import { GCloudStorageClient } from "../gcp/clients/gcloud-storage.client.js";
import {
  VertexCompletionClient,
  type VertexModel,
} from "../gcp/clients/vertex-completion.client.js";
import { FileManager } from "../utils/services/file-manager.service.js";

export interface ServiceContainer {
  instagramCrawler: InstagramCrawler;
  webDriver: WebdriverIO.Browser;
  prismaClient: PrismaClient;
  reelsService: ReelsService;
  accountService: AccountService;
}

export interface ServiceInitializerConfig {
  vertexModel?: VertexModel;
  gcloudBucketName?: string;
  webDriverOptions?: typeof wdOpts;
}

const DEFAULT_CONFIG: Required<ServiceInitializerConfig> = {
  vertexModel: "gemini-2.0-flash",
  gcloudBucketName: "ig-reels-recordings",
  webDriverOptions: wdOpts,
};

/**
 * Initialize all services with async dependencies
 */
export async function initializeServices(
  config: ServiceInitializerConfig = {},
): Promise<ServiceContainer> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const prismaClient = new PrismaClient();

  const accountDao = new AccountDao(prismaClient);
  const influencerDao = new InfluencerDao(prismaClient);
  const restaurantDao = new RestaurantDao(prismaClient);
  const reelDao = new ReelDao(prismaClient);
  const commentDao = new CommentDao(prismaClient);

  const reelsService = new ReelsService(reelDao, commentDao, accountDao);
  const accountService = new AccountService(
    accountDao,
    influencerDao,
    restaurantDao,
  );

  const googleAuth = new GoogleAuth({
    keyFile: `./${process.env["VERTEX_AI_SA_KEY"]}`,
  });
  const credentials = await googleAuth.getCredentials();

  if (!credentials) {
    throw new Error("Failed to get Google Cloud credentials");
  }

  const fileManager = new FileManager();

  const vertexCompletionClient = new VertexCompletionClient(
    finalConfig.vertexModel,
    fileManager,
    credentials,
  );

  const gcloudStorageClient = new GCloudStorageClient(
    finalConfig.gcloudBucketName as "ig-reels-recordings",
    credentials,
  );

  const webDriver = await remote({
    ...finalConfig.webDriverOptions,
    logLevel: "error",
  });

  const enhancedActionsService = new EnhancedActionsService(webDriver);

  const mediaAnalysisService = new MediaAnalysisService(vertexCompletionClient);

  const instagramCrawler = new InstagramCrawler(
    webDriver,
    enhancedActionsService,
    mediaAnalysisService,
    accountService,
    gcloudStorageClient,
    reelsService,
  );

  const services: ServiceContainer = {
    instagramCrawler,
    webDriver,
    prismaClient,
    reelsService,
    accountService,
  };

  return services;
}

/**
 * Cleanup services (close connections, etc.)
 */
export async function cleanup(services: ServiceContainer): Promise<void> {
  try {
    await services.webDriver.deleteSession();
  } catch (error) {
    console.error("Error deleting WebDriver session:", error);
  }

  try {
    await services.prismaClient.$disconnect();
  } catch (error) {
    console.error("Error disconnecting Prisma client:", error);
  }
}
