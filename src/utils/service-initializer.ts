import { type CredentialBody, GoogleAuth } from "google-auth-library";
import { remote } from "webdriverio";
import { MediaAnalysisService } from "../analysis/services/media-analysis.service.js";
import { wdOpts } from "../config.js";
import { GCloudStorageClient } from "../gcp/clients/gcloud-storage.client.js";
import { VertexCompletionClient } from "../gcp/clients/vertex-completion.client.js";
import { FileManager } from "./services/file-manager.service.js";

type VertexModel = "gemini-2.5-flash" | "gemini-2.5-flash-lite";

export interface ServiceContainer {
  fileManager: FileManager;
  vertexCompletionClient: VertexCompletionClient;
  gcloudStorageClient: GCloudStorageClient;
  mediaAnalysisService: MediaAnalysisService;
  webDriver: WebdriverIO.Browser;
  credentials: CredentialBody;
}

export interface ServiceInitializerConfig {
  vertexModel?: VertexModel;
  gcloudBucketName?: string;
  webDriverOptions?: any;
}

const DEFAULT_CONFIG: Required<ServiceInitializerConfig> = {
  vertexModel: "gemini-2.5-flash-lite",
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

  const webDriver = await remote(finalConfig.webDriverOptions);

  const mediaAnalysisService = new MediaAnalysisService(vertexCompletionClient);

  const services: ServiceContainer = {
    fileManager,
    vertexCompletionClient,
    gcloudStorageClient,
    credentials,
    webDriver,
    mediaAnalysisService,
  };

  return services;
}

/**
 * Cleanup services (close connections, etc.)
 */
export async function cleanup(services: ServiceContainer): Promise<void> {
  if (services.webDriver) {
    try {
      await services.webDriver.deleteSession();
    } catch (error) {
      console.error("Error deleting WebDriver session:", error);
    }
  }
}
