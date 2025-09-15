import type { z } from "zod";
import type { Completion } from "@/gcp/clients/vertex-completion.client";
import type { MEDIA_TYPE } from "./constants";
import type {
  COMMENT_SECTION_SCHEMA,
  INSTAGRAM_PROFILE_SCHEMA,
} from "./schemas";

export type MediaAnalysisInput<T> =
  | {
      image_file_path: string;

      type: MEDIA_TYPE.IMAGE;
      config: {
        prompt: string;
        schema: z.ZodSchema<T>;
      };
    }
  | {
      video_gcloud_uri: string;

      type: MEDIA_TYPE.VIDEO;
      config: {
        prompt: string;
        schema: z.ZodSchema<T>;
      };
    };

export type MediaAnalysisResult<T> = {
  completion: Completion | null;
  parsed: T;
};

export type InstagramProfileAnalysisResult = z.infer<
  typeof INSTAGRAM_PROFILE_SCHEMA
>;

export type CommentSectionAnalysisResult = z.infer<
  typeof COMMENT_SECTION_SCHEMA
>;
