import type {
  Comment,
  Prisma,
  PrismaClient,
} from "../../../generated/prisma/index.js";

export class CommentDao {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new comment
   * @param data Comment data to create
   * @returns Promise<Comment> The created comment
   */
  async create(
    data: Omit<Comment, "id" | "created_at" | "updated_at">,
  ): Promise<Comment> {
    return await this.prisma.comment.create({
      data: {
        text: data.text,
        like_count: data.like_count,
        reply_count: data.reply_count,
        uploaded_at: data.uploaded_at,
        reel_id: data.reel_id,
        username: data.username,
      },
      include: {
        reel: true,
      },
    });
  }

  /**
   * Create multiple comments in a single transaction
   * @param data Array of comment data to create
   * @returns Promise<Comment[]> Array of created comments
   */
  async createMany(data: Prisma.CommentCreateManyInput[]): Promise<Comment[]> {
    await this.prisma.comment.createMany({
      data,
      skipDuplicates: true,
    });

    // Since createMany doesn't return the created records, we need to fetch them
    // This is a limitation of Prisma's createMany
    const reelIds = [...new Set(data.map((comment) => comment.reel_id))];
    return await this.prisma.comment.findMany({
      where: {
        reel_id: { in: reelIds },
      },
      include: {
        reel: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Find a comment by ID
   * @param id The comment ID to search for
   * @returns Promise<Comment | null> The comment if found, null otherwise
   */
  async findById(id: string): Promise<Comment | null> {
    return await this.prisma.comment.findUnique({
      where: { id },
      include: {
        reel: true,
      },
    });
  }

  /**
   * Find comments by reel ID
   * @param reelId The reel ID to search for
   * @returns Promise<Comment[]> Array of comments for the reel
   */
  async findByReelId(reelId: string): Promise<Comment[]> {
    return await this.prisma.comment.findMany({
      where: { reel_id: reelId },
      include: {
        reel: true,
      },
      orderBy: { uploaded_at: "desc" },
    });
  }

  /**
   * Find comments by username
   * @param username The username to search for
   * @returns Promise<Comment[]> Array of comments by the user
   */
  async findByUsername(username: string): Promise<Comment[]> {
    return await this.prisma.comment.findMany({
      where: { username },
      include: {
        reel: true,
      },
      orderBy: { uploaded_at: "desc" },
    });
  }

  /**
   * Find a comment by unique content (reel_id, username, text, uploaded_at)
   * @param reelId The reel ID
   * @param username The username
   * @param text The comment text
   * @param uploadedAt The upload timestamp
   * @returns Promise<Comment | null> The comment if found, null otherwise
   */
  async findByContent(
    reelId: string,
    username: string,
    text: string,
    uploadedAt: Date,
  ): Promise<Comment | null> {
    return await this.prisma.comment.findFirst({
      where: {
        reel_id: reelId,
        username,
        text,
        uploaded_at: uploadedAt,
      },
      include: {
        reel: true,
      },
    });
  }

  /**
   * Update an existing comment
   * @param id The comment ID to update
   * @param data The data to update
   * @returns Promise<Comment> The updated comment
   */
  async update(id: string, data: Prisma.CommentUpdateInput): Promise<Comment> {
    return await this.prisma.comment.update({
      where: { id },
      data,
      include: {
        reel: true,
      },
    });
  }

  /**
   * Create or update a comment (upsert) based on unique content
   * @param data Comment data for upsert
   * @returns Promise<Comment> The created or updated comment
   */
  async upsert(
    data: Omit<Comment, "id" | "created_at" | "updated_at"> & {
      reel_id: string;
    },
  ): Promise<Comment> {
    const existing = await this.findByContent(
      data.reel_id,
      data.username,
      data.text,
      data.uploaded_at,
    );

    if (existing) {
      return await this.update(existing.id, {
        like_count: data.like_count,
        reply_count: data.reply_count,
      });
    }

    return await this.create(data);
  }

  /**
   * Delete a comment by ID
   * @param id The comment ID to delete
   * @returns Promise<Comment> The deleted comment
   */
  async delete(id: string): Promise<Comment> {
    return await this.prisma.comment.delete({
      where: { id },
    });
  }

  /**
   * Delete all comments for a reel
   * @param reelId The reel ID
   * @returns Promise<number> Count of deleted comments
   */
  async deleteByReelId(reelId: string): Promise<number> {
    const result = await this.prisma.comment.deleteMany({
      where: { reel_id: reelId },
    });
    return result.count;
  }

  /**
   * List comments with pagination
   * @param skip Number of records to skip
   * @param take Number of records to take
   * @returns Promise<Comment[]> Array of comments
   */
  async list(skip = 0, take = 10): Promise<Comment[]> {
    return await this.prisma.comment.findMany({
      skip,
      take,
      orderBy: { uploaded_at: "desc" },
      include: {
        reel: true,
      },
    });
  }

  /**
   * Count total comments
   * @returns Promise<number> Total count of comments
   */
  async count(): Promise<number> {
    return await this.prisma.comment.count();
  }

  /**
   * Count comments by reel ID
   * @param reelId The reel ID
   * @returns Promise<number> Count of comments for the reel
   */
  async countByReelId(reelId: string): Promise<number> {
    return await this.prisma.comment.count({
      where: { reel_id: reelId },
    });
  }
}
