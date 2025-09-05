import type { z } from "zod";
import type { VertexCompletionClient } from "@/gcp/clients/vertex-completion.client.js";
import { ANALYSES } from "../config.js";
import type { MediaAnalysisInput, MediaAnalysisResult } from "../types";

export class MediaAnalysisService {
  constructor(protected vertexCompletionClient: VertexCompletionClient) {}

  protected async analyzeImage(
    image_file_path: string,
    prompt: string,
    schema: z.ZodSchema,
  ): Promise<MediaAnalysisResult> {
    const completion = await this.vertexCompletionClient.promptWithImage(
      prompt,
      image_file_path,
      true,
      0,
    );

    return {
      completion,
      parsed: schema.safeParse(completion?.response),
    };
  }

  protected async analyzeVideo(
    video_gcloud_uri: string,
    prompt: string,
    schema: z.ZodSchema,
  ): Promise<MediaAnalysisResult> {
    const completion = await this.vertexCompletionClient.promptWithVideo(
      prompt,
      video_gcloud_uri,
      "video/mp4",
      true,
      0,
    );

    return {
      completion,
      parsed: schema.safeParse(completion?.response),
    };
  }

  private async analyzeWithRetry(
    input: MediaAnalysisInput,
    prompt: string,
    schema: z.ZodSchema,
    retryCount = 0,
  ): Promise<MediaAnalysisResult> {
    const maxRetries = 3;

    let result: MediaAnalysisResult;
    switch (input.type) {
      case "image":
        result = await this.analyzeImage(input.image_file_path, prompt, schema);
        break;
      case "video":
        result = await this.analyzeVideo(
          input.video_gcloud_uri,
          prompt,
          schema,
        );
        break;
      default:
        throw new Error(`Unsupported input type`);
    }

    if (!result.parsed.success && retryCount < maxRetries) {
      return this.analyzeWithRetry(input, prompt, schema, retryCount + 1);
    }

    return result;
  }

  async analyze(input: MediaAnalysisInput): Promise<MediaAnalysisResult> {
    const { prompt, schema, type } = ANALYSES[input.analysis_name] || {};

    const type_is_mismatched = input.type !== type;

    if (type_is_mismatched) {
      throw new Error(
        `[MediaAnalysisService]: Analysis ${input.analysis_name} is not supported for ${input.type} media`,
      );
    }

    if (!prompt || !schema) {
      throw new Error(
        `[MediaAnalysisService]: Analysis ${input.analysis_name} not found`,
      );
    }

    const { completion, parsed } = await this.analyzeWithRetry(
      input,
      prompt,
      schema,
    );

    return {
      completion,
      parsed,
    };
  }
}
