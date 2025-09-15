import type { z } from "zod";
import type { VertexCompletionClient } from "@/gcp/clients/vertex-completion.client.js";
import { MEDIA_TYPE } from "../constants.js";
import type { MediaAnalysisInput, MediaAnalysisResult } from "../types";

export class MediaAnalysisService {
  constructor(protected vertexCompletionClient: VertexCompletionClient) {}

  protected async analyzeImage<T>(
    image_file_path: string,
    prompt: string,
    schema: z.ZodSchema<T>,
    temperature = 0,
  ): Promise<MediaAnalysisResult<T>> {
    const completion = await this.vertexCompletionClient.promptWithImage(
      prompt,
      image_file_path,
      true,
      temperature,
    );

    return {
      completion,
      parsed: schema.parse(completion?.response),
    };
  }

  protected async analyzeVideo<T>(
    video_gcloud_uri: string,
    prompt: string,
    schema: z.ZodSchema<T>,
    temperature = 0,
  ): Promise<MediaAnalysisResult<T>> {
    const completion = await this.vertexCompletionClient.promptWithVideo(
      prompt,
      video_gcloud_uri,
      "video/mp4",
      true,
      temperature,
    );

    return {
      completion,
      parsed: schema.parse(completion?.response),
    };
  }

  async analyze<T>(
    input: MediaAnalysisInput<T>,
    temperature = 0,
    retryCount = 0,
  ): Promise<MediaAnalysisResult<T>> {
    const maxRetries = 3;

    let result: MediaAnalysisResult<T>;
    switch (input.type) {
      case MEDIA_TYPE.IMAGE:
        result = await this.analyzeImage(
          input.image_file_path,
          input.config.prompt,
          input.config.schema,
          temperature,
        );
        break;
      case MEDIA_TYPE.VIDEO:
        result = await this.analyzeVideo(
          input.video_gcloud_uri,
          input.config.prompt,
          input.config.schema,
          temperature,
        );
        break;
      default:
        throw new Error(`Unsupported input type`);
    }

    if (!result.parsed && retryCount < maxRetries) {
      return this.analyze(input, temperature, retryCount + 1);
    }

    return result;
  }
}
