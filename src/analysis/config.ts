import { z } from "zod";
import { MEDIA_TYPE } from "./constants.js";

export const ANALYSES: Record<
  string,
  {
    type: MEDIA_TYPE;
    prompt: string;
    schema: z.ZodSchema;
  }
> = {
  test: {
    type: MEDIA_TYPE.IMAGE,
    prompt:
      "What is the image? Respond in JSON with the schema: {image: string}",
    schema: z.object({
      image: z.string(),
    }),
  },
  test_video: {
    type: MEDIA_TYPE.VIDEO,
    prompt:
      "What is the video? Respond in JSON with the schema: {video: string}",
    schema: z.object({
      video: z.string(),
    }),
  },
};

export type AVAILABLE_ANALYSES = keyof typeof ANALYSES;
