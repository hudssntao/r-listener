import type { CommentSectionAnalysisResult } from "@/analysis/types.js";
import type { Comment, Reel } from "../../../generated/prisma/index.js";
import {
  parseCommentUploadedAt,
  parseUploadedAt,
} from "../../utils/date-parser.js";
import type { AccountDao } from "../dao/account.dao.js";
import type { CommentDao } from "../dao/comment.dao.js";
import type { ReelDao } from "../dao/reel.dao.js";

export type ReelData = {
  caption: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  uploaded_at: string;
  collaborator_usernames?: string[];
  mentioned_usernames?: string[];
};

export type CommentData = CommentSectionAnalysisResult["comments"][0];

/**
 * Service for handling Instagram reel data operations
 */
export class ReelsService {
  constructor(
    private reel_dao: ReelDao,
    private comment_dao: CommentDao,
    private account_dao: AccountDao,
  ) {}

  /**
   * Upsert a reel with its collaborators
   * @param reel_data The reel data to upsert
   * @returns Promise<Reel> The created or updated reel
   */
  async upsertReel(reel_data: ReelData): Promise<Reel> {
    const uploaded_at = parseUploadedAt(reel_data.uploaded_at);

    const collaborators: { connect: { id: string }[] } = { connect: [] };
    const mentions: { connect: { id: string }[] } = { connect: [] };

    if (reel_data.collaborator_usernames?.length) {
      for (const username of reel_data.collaborator_usernames) {
        const account = await this.account_dao.findByUsername(username);

        if (!account) {
          console.warn(
            `[ReelsService]: Collaborator ${username} not found for reel with caption ${reel_data.caption.slice(0, 30)}${reel_data.caption.length > 30 ? "..." : ""}`,
          );
          continue;
        }

        collaborators.connect.push({ id: account.id });
      }
    }

    if (reel_data.mentioned_usernames?.length) {
      for (const username of reel_data.mentioned_usernames) {
        const account = await this.account_dao.findByUsername(username);

        if (!account) {
          console.warn(
            `[ReelsService]: Mentioned user ${username} not found for reel with caption ${reel_data.caption.slice(0, 30)}${reel_data.caption.length > 30 ? "..." : ""}`,
          );

          continue;
        }

        mentions.connect.push({ id: account.id });
      }
    }

    return await this.reel_dao.upsert({
      caption: reel_data.caption,
      like_count: reel_data.like_count,
      comment_count: reel_data.comment_count,
      share_count: reel_data.share_count,
      uploaded_at,
      collaborators:
        collaborators.connect.length > 0 ? collaborators : undefined,
      mentions: mentions.connect.length > 0 ? mentions : undefined,
    });
  }

  /**
   * Upsert a comment for a reel
   * @param reel_id The reel ID
   * @param comment_data The individual comment data from analysis
   * @returns Promise<Comment> The created or updated comment
   */
  async upsertComment(
    reel_id: string,
    comment_data: Omit<Comment, "id" | "created_at" | "updated_at" | "reel_id">,
  ): Promise<Comment> {
    return await this.comment_dao.upsert({
      reel_id,
      username: comment_data.username,
      text: comment_data.text,
      like_count: comment_data.like_count,
      reply_count: comment_data.reply_count,
      uploaded_at: comment_data.uploaded_at,
    });
  }

  /**
   * Upsert multiple comments for a reel
   * @param reel_id The reel ID
   * @param comments_data Array of individual comment data from analysis
   * @returns Promise<Comment[]> Array of created or updated comments
   */
  async upsertComments(
    reel_id: string,
    comments_data: CommentData[],
  ): Promise<Comment[]> {
    const comments: Comment[] = [];

    for (const comment_data of comments_data) {
      const uploaded_at = parseCommentUploadedAt(comment_data.uploaded_at);

      const comment = await this.upsertComment(reel_id, {
        ...comment_data,
        uploaded_at,
      });
      comments.push(comment);
    }

    return comments;
  }

  /**
   * Complete reel upsert with comments - main method for Instagram crawler
   * @param reel_data The reel data
   * @param comments_data Array of individual comment data
   * @returns Promise<{ reel: Reel; comments: Comment[] }>
   */
  async upsertReelWithComments(
    reel_data: ReelData,
    comments_data: CommentData[] = [],
  ): Promise<{ reel: Reel; comments: Comment[] }> {
    const reel = await this.upsertReel(reel_data);
    const comments = await this.upsertComments(reel.id, comments_data);

    return { reel, comments };
  }
}
