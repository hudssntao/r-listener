import fs from "node:fs/promises";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";
import { MEDIA_TYPE } from "../analysis/constants.js";
import {
  COMMENT_SECTION_PROMPT,
  INSTAGRAM_PROFILE_PROMPT,
} from "../analysis/prompts.js";
import {
  COMMENT_SECTION_SCHEMA,
  INSTAGRAM_PROFILE_SCHEMA,
} from "../analysis/schemas.js";
import type { MediaAnalysisService } from "../analysis/services/media-analysis.service.js";
import type {
  CommentSectionAnalysisResult,
  InstagramProfileAnalysisResult,
} from "../analysis/types.js";
import type { AccountService } from "../db/services/account.service.js";
import type { ReelsService } from "../db/services/reels.service.js";
import type { GCloudStorageClient } from "../gcp/clients/gcloud-storage.client.js";
import { generateRandomSleepTimeInMs } from "../utils/sleep.js";
import type { EnhancedActionsService } from "./services/enhanced-actions.service.js";

/**
 * Crawls an Instagram profile and its reels.
 */
export class InstagramCrawler {
  constructor(
    private web_driver: WebdriverIO.Browser,
    private enhanced_actions_service: EnhancedActionsService,
    private media_analysis_service: MediaAnalysisService,
    private account_service: AccountService,
    private gcloud_storage_client: GCloudStorageClient,
    private reels_service: ReelsService,
  ) {}

  async crawl(initial_username: string) {
    console.log(
      `🚀 [Instagram Crawler] Starting crawl for user: ${initial_username}`,
    );
    console.log(`📱 [Instagram Crawler] Phase 1: Navigating to search tab`);
    await this.web_driver.pause(generateRandomSleepTimeInMs("long"));
    const search_tab = await this.web_driver.$("~explore-tab").getElement();
    if (!search_tab) {
      throw new Error("[InstagramCrawler]: Could not find search tab");
    }
    console.log(`✅ [Instagram Crawler] Found search tab, tapping...`);
    await this.enhanced_actions_service.tapRandomPointInElement(search_tab);
    await this.web_driver.pause(generateRandomSleepTimeInMs("short"));
    console.log(`🔍 [Instagram Crawler] Phase 2: Locating search input`);
    const search_input = await this.web_driver
      .$("~search-text-input")
      .getElement();
    if (!search_input) {
      throw new Error("[InstagramCrawler]: Could not find search input");
    }
    console.log(`✅ [Instagram Crawler] Found search input, tapping...`);
    await this.enhanced_actions_service.tapRandomPointInElement(search_input);
    await this.web_driver.pause(generateRandomSleepTimeInMs("very short"));
    console.log(
      `👤 [Instagram Crawler] Phase 3: Searching for user ${initial_username}`,
    );
    const initial_user_element = await this.web_driver
      .$(`//*[contains(@name, "${initial_username}")]`)
      .getElement();
    if (!initial_user_element) {
      throw new Error(
        `[InstagramCrawler]: Could not find initial user ${initial_username} in recent search results`,
      );
    }
    console.log(
      `✅ [Instagram Crawler] Found user ${initial_username}, navigating to profile...`,
    );
    await this.enhanced_actions_service.tapRandomPointInElement(
      initial_user_element,
    );
    await this.web_driver.pause(generateRandomSleepTimeInMs("very short"));
    console.log(
      `📋 [Instagram Crawler] Phase 4: Starting profile crawl with reels enabled`,
    );
    await this.crawlProfile({ username: initial_username, crawl_reels: true });
  }

  async crawlProfile({
    username,
    crawl_reels,
  }: {
    username: string;
    crawl_reels: boolean;
  }) {
    console.log(
      `👤 [Profile Crawler] Analyzing profile: ${username} ${crawl_reels ? "(with reels)" : "(profile only)"}`,
    );
    console.log(
      `📸 [Profile Crawler] Step 1: Taking screenshot for AI analysis`,
    );
    const screenshot_path =
      await this.enhanced_actions_service.saveScreenshot();

    console.log(`🤖 [Profile Crawler] Step 2: Analyzing profile with AI...`);
    const analysis_result =
      await this.media_analysis_service.analyze<InstagramProfileAnalysisResult>(
        {
          type: MEDIA_TYPE.IMAGE,
          image_file_path: screenshot_path,
          config: {
            prompt: INSTAGRAM_PROFILE_PROMPT,
            schema: INSTAGRAM_PROFILE_SCHEMA,
          },
        },
      );

    console.log(`💾 [Profile Crawler] Step 3: Saving profile data to database`);
    await this.account_service.upsertProfile(analysis_result.parsed);

    if (!crawl_reels) {
      console.log(
        `⏭️ [Profile Crawler] Finished crawling profile for ${username}`,
      );
      return;
    }

    console.log(`🎬 [Profile Crawler] Step 4: Navigating to reels tab`);
    const reels_tab = await this.web_driver.$("~Reels").getElement();

    if (!reels_tab) {
      throw new Error("[InstagramCrawler]: Could not find reels tab");
    }

    console.log(`✅ [Profile Crawler] Found reels tab, tapping...`);
    await this.enhanced_actions_service.tapRandomPointInElement(reels_tab);

    await this.web_driver.pause(generateRandomSleepTimeInMs("very short"));

    console.log(`🎬 [Profile Crawler] Starting reels crawl for ${username}`);
    await this.crawlReels(username);

    console.log(`⏭️ [Profile Crawler] Finished crawling reels for ${username}`);
  }

  async crawlReels(
    username: string,
    range: { min: number; max: number } = { min: 18, max: 24 },
  ) {
    const { min, max } = range;
    const limit = Math.floor(Math.random() * (max - min + 1)) + min;

    console.log(
      `🎬 [Reels Crawler] Starting reels crawl for ${username} (target: ${limit} reels)`,
    );

    console.log(`🎥 [Reels Crawler] Locating first reel thumbnail`);
    const reels_video_thumbnail = await this.web_driver
      .$("~reels-video-thumbnail")
      .getElement();

    if (!reels_video_thumbnail) {
      throw new Error(
        "[InstagramCrawler]: Could not find initial reels video thumbnail",
      );
    }

    console.log(`✅ [Reels Crawler] Found first reel, starting playback...`);
    await this.enhanced_actions_service.tapRandomPointInElement(
      reels_video_thumbnail,
    );

    for (let i = 0; i < limit; i++) {
      console.log(`\n🎬 [Reels Crawler] Processing reel ${i + 1}/${limit}`);

      const intial_random_wait = generateRandomSleepTimeInMs("medium");
      console.log(
        `🕒 [Reels Crawler] Waiting for ${intial_random_wait}ms to simulate human behavior...`,
      );
      await this.web_driver.pause(intial_random_wait);

      const likes_promise = this.web_driver
        .$('//*[contains(@name, "likes")]')
        .getAttribute("name");
      const comments_promise = this.web_driver
        .$('//*[contains(@name, "comments")]')
        .getAttribute("name");
      const shares_promise = this.web_driver
        .$('//*[contains(@name, "shares")]')
        .getAttribute("name");
      const caption_button_promise = this.web_driver
        .$('//*[contains(@name, "caption-button")]')
        .getElement();

      const [likes_name, comments_name, shares_name, caption_button] =
        await Promise.all([
          likes_promise,
          comments_promise,
          shares_promise,
          caption_button_promise,
        ]);

      const like_count = parseInt(likes_name.split(" ")[0] || "0", 10);
      const comment_count = parseInt(comments_name.split(" ")[0] || "0", 10);
      const share_count = parseInt(shares_name.split(" ")[0] || "0", 10);

      console.log(
        `📊 [Reels Crawler] Reel stats - Likes: ${like_count}, Comments: ${comment_count}, Shares: ${share_count}`,
      );

      await this.web_driver.pause(generateRandomSleepTimeInMs("very short"));

      console.log(`📝 [Reels Crawler] Extracting caption and metadata`);
      await this.enhanced_actions_service.tapRandomPointInElement(
        caption_button,
      );

      const caption_elements = caption_button.$$("XCUIElementTypeStaticText");

      let caption = "";
      let uploaded_at = "";

      let elementIndex = 0;
      for await (const caption_element of caption_elements) {
        const text = await caption_element.getAttribute("name");

        switch (elementIndex) {
          case 0: // First element is the uploaded at
            uploaded_at = text;
            break;
          case 1: // Second element is the caption
            caption = text;
            break;
          default:
            console.warn(
              `[InstagramCrawler]: Unknown caption element index: ${elementIndex}, text: ${text}`,
            );
        }
        elementIndex++;
      }

      console.log(
        `📅 [Reels Crawler] Caption: "${caption.substring(0, 50)}${caption.length > 50 ? "..." : ""}" | Uploaded: ${uploaded_at}`,
      );

      await this.web_driver.pause(generateRandomSleepTimeInMs("very short"));

      console.log(`👥 [Reels Crawler] Scanning for user mentions`);
      await this.enhanced_actions_service.swipeWithinElement(
        caption_button,
        "up",
        "slow",
        "medium",
        "right",
      );

      await this.web_driver.pause(generateRandomSleepTimeInMs("medium"));

      const mentions = this.web_driver.$$(
        '//XCUIElementTypeLink[contains(@name, "@")]',
      );

      const mentioned_usernames: string[] = [];

      console.log(
        `🔍 [Reels Crawler] Found ${mentions.length} user mentions to process`,
      );
      for await (const mention of mentions) {
        const mention_text = await mention.getAttribute("name");
        const username = mention_text.replace("@", "").trim();
        mentioned_usernames.push(username);

        console.log(
          `👤 [Reels Crawler] Processing mentioned user: @${username}`,
        );
        await this.enhanced_actions_service.tapRandomPointInElement(mention);

        await this.crawlProfile({ username, crawl_reels: false });

        console.log(`⬅️ [Reels Crawler] Returning from @${username} profile`);
        const back_button = await this.web_driver
          .$("~profile-back-button")
          .getElement();

        await this.enhanced_actions_service.tapRandomPointInElement(
          back_button,
        );
      }

      await this.web_driver.pause(generateRandomSleepTimeInMs("very short"));

      await this.enhanced_actions_service.tapRandomPointInElement(
        caption_button,
      );

      console.log(
        `💬 [Reels Crawler] Opening comments section (${comment_count} comments)`,
      );
      const comments_button = await this.web_driver
        .$('//*[contains(@name, "comments")]')
        .getElement();

      await this.enhanced_actions_service.tapRandomPointInElement(
        comments_button,
      );

      const scrolls = Math.min(Math.floor(comment_count / 10), 8);
      // const randomized_scrolls = generateRandomIntegerInRange(
      //   scrolls - 2,
      //   scrolls + 1,
      // );
      const randomized_scrolls = 1;

      console.log(
        `📹 [Reels Crawler] Recording comments section (${randomized_scrolls} scrolls)`,
      );
      await this.enhanced_actions_service.startScreenRecording();

      for (let scroll = 0; scroll < randomized_scrolls; scroll++) {
        console.log(
          `📜 [Reels Crawler] Scrolling comments ${scroll + 1}/${randomized_scrolls}`,
        );
        await this.enhanced_actions_service.swipeScreen(
          "up",
          "medium",
          "medium",
          "right",
        );

        await this.web_driver.pause(generateRandomSleepTimeInMs("short"));
      }

      console.log(`💾 [Reels Crawler] Saving and uploading comments recording`);
      const recording_path =
        await this.enhanced_actions_service.saveScreenRecording();

      const recording_uri = await this.gcloud_storage_client.uploadLocalFile(
        recording_path,
        `${uuidv4().substring(0, 8)}.mp4`,
      );

      console.log(`🗑️ [Reels Crawler] Cleaning up local recording file`);
      await fs.unlink(recording_path);

      if (!recording_uri) {
        throw new Error(
          "[InstagramCrawler]: Failed to upload recording to GCloud Storage",
        );
      }

      console.log(`🤖 [Reels Crawler] Analyzing comments with AI`);
      const comment_analysis_result =
        await this.media_analysis_service.analyze<CommentSectionAnalysisResult>(
          {
            type: MEDIA_TYPE.VIDEO,
            video_gcloud_uri: recording_uri,
            config: {
              prompt: COMMENT_SECTION_PROMPT,
              schema: COMMENT_SECTION_SCHEMA,
            },
          },
        );

      console.log(
        `💾 [Reels Crawler] Saving reel data and ${comment_analysis_result.parsed.comments.length} comments to database`,
      );
      const reel_data = {
        caption,
        like_count,
        comment_count,
        share_count,
        uploaded_at,
        gcloud_uri: recording_uri,
        collaborator_usernames: [username],
        mentioned_usernames: mentioned_usernames,
      };

      await this.reels_service.upsertReelWithComments(
        reel_data,
        comment_analysis_result.parsed.comments,
      );

      console.log(`⬇️ [Reels Crawler] Navigating to next reel`);
      const navigation_bar = await this.web_driver
        .$("~navigation-bar")
        .getElement();

      await this.enhanced_actions_service.swipeStartingFromElement(
        navigation_bar,
        "down",
        "fast",
        "short",
        "right",
      );

      const final_random_wait = generateRandomSleepTimeInMs("very long");
      console.log(
        `🕒 [Reels Crawler] Waiting for ${final_random_wait}ms to simulate human behavior...`,
      );
      await this.web_driver.pause(final_random_wait);

      await this.enhanced_actions_service.swipeScreen(
        "up",
        "fast",
        "short",
        "right",
      );

      console.log(`✅ [Reels Crawler] Completed reel ${i + 1}/${limit}`);
    }

    console.log(
      `🎉 [Reels Crawler] Completed crawling ${limit} reels for ${username}`,
    );
  }
}
