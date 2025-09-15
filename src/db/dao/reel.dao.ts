import type {
  Prisma,
  PrismaClient,
  Reel,
} from "../../../generated/prisma/index.js";

export class ReelDao {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new reel
   * @param data Reel data to create
   * @returns Promise<Reel> The created reel
   */
  async create(data: Prisma.ReelCreateInput): Promise<Reel> {
    return await this.prisma.reel.create({
      data,
      include: {
        comments: true,
        collaborators: true,
      },
    });
  }

  /**
   * Find a reel by ID
   * @param id The reel ID to search for
   * @returns Promise<Reel | null> The reel if found, null otherwise
   */
  async findById(id: string): Promise<Reel | null> {
    return await this.prisma.reel.findUnique({
      where: { id },
      include: {
        comments: true,
        collaborators: true,
      },
    });
  }

  /**
   * Find reels by caption and uploaded_at (for duplicate detection)
   * @param caption The reel caption
   * @param uploaded_at The upload timestamp
   * @returns Promise<Reel | null> The reel if found, null otherwise
   */
  async findByContent(
    caption: string,
    uploaded_at: Date,
  ): Promise<Reel | null> {
    return await this.prisma.reel.findFirst({
      where: {
        caption,
        uploaded_at,
      },
      include: {
        comments: true,
        collaborators: true,
      },
    });
  }

  /**
   * Update an existing reel
   * @param id The reel ID to update
   * @param data The data to update
   * @returns Promise<Reel> The updated reel
   */
  async update(id: string, data: Prisma.ReelUpdateInput): Promise<Reel> {
    return await this.prisma.reel.update({
      where: { id },
      data,
      include: {
        comments: true,
        collaborators: true,
      },
    });
  }

  /**
   * Create or update a reel (upsert) based on caption and uploaded_at
   * @param data Reel data for upsert
   * @returns Promise<Reel> The created or updated reel
   */
  async upsert(
    data: Omit<Prisma.ReelCreateInput, "id" | "created_at" | "updated_at">,
  ): Promise<Reel> {
    const existing = await this.findByContent(
      data.caption,
      data.uploaded_at as Date,
    );

    if (existing) {
      return await this.update(existing.id, {
        like_count: data.like_count,
        comment_count: data.comment_count,
        share_count: data.share_count,
        collaborators: data.collaborators,
      });
    }

    return await this.create(data);
  }

  /**
   * Delete a reel by ID
   * @param id The reel ID to delete
   * @returns Promise<Reel> The deleted reel
   */
  async delete(id: string): Promise<Reel> {
    return await this.prisma.reel.delete({
      where: { id },
    });
  }

  /**
   * List reels with pagination
   * @param skip Number of records to skip
   * @param take Number of records to take
   * @returns Promise<Reel[]> Array of reels
   */
  async list(skip = 0, take = 10): Promise<Reel[]> {
    return await this.prisma.reel.findMany({
      skip,
      take,
      orderBy: { uploaded_at: "desc" },
      include: {
        comments: true,
        collaborators: true,
      },
    });
  }

  /**
   * Count total reels
   * @returns Promise<number> Total count of reels
   */
  async count(): Promise<number> {
    return await this.prisma.reel.count();
  }

  /**
   * Find reels by collaborator account ID
   * @param accountId The account ID of the collaborator
   * @returns Promise<Reel[]> Array of reels
   */
  async findByCollaboratorId(accountId: string): Promise<Reel[]> {
    return await this.prisma.reel.findMany({
      where: {
        collaborators: {
          some: {
            id: accountId,
          },
        },
      },
      include: {
        comments: true,
        collaborators: true,
      },
      orderBy: { uploaded_at: "desc" },
    });
  }
}
