import type { Completion } from "@/gcp/clients/vertex-completion.client";
import type { AVAILABLE_ANALYSES } from "./config";
import type { MEDIA_TYPE } from "./constants";

export type MediaAnalysisInput =
  | {
      type: MEDIA_TYPE.IMAGE;
      image_file_path: string;
      analysis_name: AVAILABLE_ANALYSES;
    }
  | {
      type: MEDIA_TYPE.VIDEO;
      video_gcloud_uri: string;
      analysis_name: AVAILABLE_ANALYSES;
    };

export type MediaAnalysisResult = {
  completion: Completion | null;
  parsed: any;
};
