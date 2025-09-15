import { z } from "zod";

export const INSTAGRAM_PROFILE_SCHEMA = z.object({
  username: z.string(),
  display_name: z.string(),
  bio: z.string(),
  follower_count: z.number().nullable(),
  following_count: z.number().nullable(),
  is_verified: z.boolean(),
  ethnicity: z
    .enum([
      "ASIAN",
      "BLACK",
      "HISPANIC",
      "MIDDLE_EASTERN",
      "NATIVE_AMERICAN",
      "PACIFIC_ISLANDER",
      "WHITE",
    ])
    .nullable(),
  gender: z.enum(["MALE", "FEMALE"]).nullable(),
  age_group: z.enum(["YOUNG_ADULT", "MIDDLE_AGED", "SENIOR"]).nullable(),
  profile_type: z.enum(["INFLUENCER", "RESTAURANT", "OTHER"]),
});

export const COMMENT_SECTION_SCHEMA = z.object({
  comments: z.array(
    z.object({
      text: z.string(),
      username: z.string(),
      uploaded_at: z.object({
        unit: z.enum([
          "second",
          "minute",
          "hour",
          "day",
          "week",
          "month",
          "year",
        ]),
        value: z.number(),
      }),
      like_count: z.number(),
      reply_count: z.number(),
    }),
  ),
});
