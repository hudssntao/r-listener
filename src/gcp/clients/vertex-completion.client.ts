import {
  type GenerateContentResult,
  type GenerativeModel,
  GoogleGenerativeAIError,
  VertexAI,
} from "@google-cloud/vertexai";
import type { CredentialBody } from "google-auth-library";
import type { FileManager } from "../../utils/services/file-manager.service.js";

export type Completion = {
  response: any;
  cost: number;
};

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
}

interface ModelPricing {
  inputCostPer1M: number; // Cost per 1M input tokens in USD
  outputCostPer1M: number; // Cost per 1M output tokens in USD
}

type VertexModel = "gemini-2.5-flash" | "gemini-2.5-flash-lite";

/*
 * INFO: Client for interfacing with the VertexAI API.
 * Supports prompting with image, text, and video.
 */
export class VertexCompletionClient {
  private static readonly MODELS: Record<VertexModel, ModelPricing> = {
    "gemini-2.5-flash": {
      inputCostPer1M: 0.3,
      outputCostPer1M: 2.5,
    },
    "gemini-2.5-flash-lite": {
      inputCostPer1M: 0.1,
      outputCostPer1M: 0.4,
    },
  };

  private readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10 * 1000,
  };

  private model: GenerativeModel;
  private modelConfig: ModelPricing;
  private vertex_client: VertexAI;

  constructor(
    model_name: VertexModel,
    private file_manager: FileManager,
    credentials: CredentialBody,
  ) {
    this.vertex_client = new VertexAI({
      project: process.env["GCP_PROJECT_ID"],
      location: process.env["GCP_PROJECT_REGION"],
      googleAuthOptions: {
        credentials: credentials,
      },
    });

    this.modelConfig = VertexCompletionClient.MODELS[model_name];
    this.model = this.vertex_client.getGenerativeModel({
      model: model_name,
    });
  }

  // INFO: Retries when model is overloaded or JSON is incorrect
  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    config: RetryConfig = this.defaultRetryConfig,
  ): Promise<T> {
    let delay = config.initialDelay;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const is_json_error = error instanceof SyntaxError;
        const is_google_error = error instanceof GoogleGenerativeAIError;
        const is_overloaded_error =
          is_google_error && error.message.includes("503");

        if (!(is_json_error || is_overloaded_error)) {
          throw error;
        }

        if (attempt === config.maxAttempts) {
          break;
        }

        delay = Math.min(delay * 2, config.maxDelay);

        console.warn(
          `[VertexCompletionClient] Attempt ${attempt} failed. Retrying in ${delay}ms...`,
          error,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(
      `[VertexCompletionClient] Failed after ${config.maxAttempts} attempts.`,
    );
  }

  private parseResultIntoJSON(result: string) {
    const cleansed_result = result.replace(/```/g, "").replace("json", "");
    const json = JSON.parse(cleansed_result);
    return json;
  }

  /**
   * Calculate the cost of a completion based on the model's pricing and token usage
   * @param result The GenerateContentResult containing usage metadata
   * @returns The total cost in USD
   */
  calculateCost(result: GenerateContentResult): number {
    const input_tokens = result.response.usageMetadata?.promptTokenCount ?? 0;
    const output_tokens =
      result.response.usageMetadata?.candidatesTokenCount ?? 0;

    const input_cost =
      (input_tokens / 1_000_000) * this.modelConfig.inputCostPer1M;
    const output_cost =
      (output_tokens / 1_000_000) * this.modelConfig.outputCostPer1M;

    const total_cost = input_cost + output_cost;

    return Math.round(total_cost * 1_000_000) / 1_000_000;
  }

  async promptWithImage(
    prompt: string,
    image_path: string,
    json_mode?: boolean,
    temperature?: number,
  ): Promise<Completion | null> {
    const image_buffer =
      await this.file_manager.convertFileToBuffer(image_path);

    if (!image_buffer) {
      return null;
    }

    const base64Image = image_buffer.toString("base64");

    const response = await this.retryWithExponentialBackoff(async () => {
      const result = await this.model.generateContent({
        generationConfig: {
          temperature,
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: base64Image,
                  mimeType: "image/jpeg",
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
      });

      const text = result.response.candidates?.[0]?.content.parts[0]?.text;

      if (!text) {
        throw new Error(
          "[VertexCompletionClient]: Error: model did not return text.",
        );
      }

      const response = json_mode ? this.parseResultIntoJSON(text) : text;

      return { response, cost: this.calculateCost(result) };
    });

    return response;
  }

  async promptWithVideo(
    prompt: string,
    gcloud_uri: string,
    mime_type = "video/mp4",
    json_mode?: boolean,
    temperature?: number,
  ): Promise<Completion | null> {
    const response = await this.retryWithExponentialBackoff(async () => {
      const result = await this.model.generateContent({
        generationConfig: {
          temperature,
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  mimeType: mime_type,
                  fileUri: gcloud_uri,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
      });

      const text = result.response.candidates?.[0]?.content.parts[0]?.text;

      if (!text) {
        throw new Error(
          "[VertexCompletionClient]: Error: model did not return text.",
        );
      }

      const response = json_mode ? this.parseResultIntoJSON(text) : text;

      return { response, cost: this.calculateCost(result) };
    });

    return response;
  }

  async prompt(
    prompt: string,
    json_mode?: boolean,
    temperature?: number,
  ): Promise<Completion> {
    const response = await this.retryWithExponentialBackoff(async () => {
      const result = await this.model.generateContent({
        generationConfig: { temperature },

        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      const text = result.response.candidates?.[0]?.content.parts[0]?.text;

      if (!text) {
        throw new Error(
          "[VertexCompletionClient]: Error: model did not return text.",
        );
      }

      const response = json_mode ? this.parseResultIntoJSON(text) : text;

      return { response, cost: this.calculateCost(result) };
    });

    return response;
  }
}
