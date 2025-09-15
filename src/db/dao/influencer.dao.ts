import type {
  Influencer,
  Prisma,
  PrismaClient,
} from "../../../generated/prisma/index.js";

export class InfluencerDao {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new influencer
   * @param data Influencer data to create
   * @returns Promise<Influencer> The created influencer
   */
  async create(data: Prisma.InfluencerCreateManyInput): Promise<Influencer> {
    return await this.prisma.influencer.create({
      data: {
        account_id: data.account_id,
      },
    });
  }

  /**
   * Find an influencer by ID
   * @param id The influencer ID to search for
   * @returns Promise<Influencer | null> The influencer if found, null otherwise
   */
  async findById(id: string): Promise<Influencer | null> {
    return await this.prisma.influencer.findUnique({
      where: { id },
      include: { account: true },
    });
  }

  /**
   * Find an influencer by account ID
   * @param accountId The account ID to search for
   * @returns Promise<Influencer | null> The influencer if found, null otherwise
   */
  async findByAccountId(accountId: string): Promise<Influencer | null> {
    return await this.prisma.influencer.findUnique({
      where: { account_id: accountId },
      include: { account: true },
    });
  }

  /**
   * Find an influencer by account username
   * @param username The account username to search for
   * @returns Promise<Influencer | null> The influencer if found, null otherwise
   */
  async findByUsername(username: string): Promise<Influencer | null> {
    return await this.prisma.influencer.findFirst({
      where: {
        account: {
          username,
        },
      },
      include: { account: true },
    });
  }

  /**
   * Delete an influencer by ID
   * @param id The influencer ID to delete
   * @returns Promise<Influencer> The deleted influencer
   */
  async delete(id: string): Promise<Influencer> {
    return await this.prisma.influencer.delete({
      where: { id },
    });
  }

  /**
   * Delete an influencer by account ID
   * @param accountId The account ID to delete influencer for
   * @returns Promise<Influencer> The deleted influencer
   */
  async deleteByAccountId(accountId: string): Promise<Influencer> {
    return await this.prisma.influencer.delete({
      where: { account_id: accountId },
    });
  }

  /**
   * List influencers with pagination
   * @param skip Number of records to skip
   * @param take Number of records to take
   * @returns Promise<Influencer[]> Array of influencers with their accounts
   */
  async list(skip = 0, take = 10): Promise<Influencer[]> {
    return await this.prisma.influencer.findMany({
      skip,
      take,
      include: { account: true },
      orderBy: { account: { created_at: "desc" } },
    });
  }

  /**
   * Count total influencers
   * @returns Promise<number> Total count of influencers
   */
  async count(): Promise<number> {
    return await this.prisma.influencer.count();
  }

  /**
   * Find influencers by follower count range
   * @param minFollowers Minimum follower count
   * @param maxFollowers Maximum follower count
   * @param skip Number of records to skip
   * @param take Number of records to take
   * @returns Promise<Influencer[]> Array of influencers matching criteria
   */
  async findByFollowerRange(
    minFollowers: number,
    maxFollowers?: number,
    skip = 0,
    take = 10,
  ): Promise<Influencer[]> {
    const whereCondition = {
      account: {
        follower_count: {
          gte: minFollowers,
          ...(maxFollowers !== undefined && { lte: maxFollowers }),
        },
      },
    };

    return await this.prisma.influencer.findMany({
      where: whereCondition,
      skip,
      take,
      include: { account: true },
      orderBy: { account: { follower_count: "desc" } },
    });
  }

  /**
   * Find verified influencers
   * @param skip Number of records to skip
   * @param take Number of records to take
   * @returns Promise<Influencer[]> Array of verified influencers
   */
  async findVerified(skip = 0, take = 10): Promise<Influencer[]> {
    return await this.prisma.influencer.findMany({
      where: {
        account: {
          is_verified: true,
        },
      },
      skip,
      take,
      include: { account: true },
      orderBy: { account: { follower_count: "desc" } },
    });
  }
}
