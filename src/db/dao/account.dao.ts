import type {
  Account,
  Prisma,
  PrismaClient,
} from "../../../generated/prisma/index.js";

export class AccountDao {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new account
   * @param data Account data to create
   * @returns Promise<Account> The created account
   */
  async create(data: Prisma.AccountCreateManyInput): Promise<Account> {
    return await this.prisma.account.create({
      data: {
        username: data.username,
        display_name: data.display_name,
        bio: data.bio,
        follower_count: data.follower_count,
        following_count: data.following_count,
        is_verified: data.is_verified ?? false,
        ethnicity: data.ethnicity,
        gender: data.gender,
        age_group: data.age_group,
      },
    });
  }

  /**
   * Find an account by username
   * @param username The username to search for
   * @returns Promise<Account | null> The account if found, null otherwise
   */
  async findByUsername(username: string): Promise<Account | null> {
    return await this.prisma.account.findUnique({
      where: { username },
    });
  }

  /**
   * Find an account by ID
   * @param id The account ID to search for
   * @returns Promise<Account | null> The account if found, null otherwise
   */
  async findById(id: string): Promise<Account | null> {
    return await this.prisma.account.findUnique({
      where: { id },
    });
  }

  /**
   * Update an existing account
   * @param id The account ID to update
   * @param data The data to update
   * @returns Promise<Account> The updated account
   */
  async update(
    id: string,
    data: Prisma.AccountUpdateManyMutationInput,
  ): Promise<Account> {
    return await this.prisma.account.update({
      where: { id },
      data,
    });
  }

  /**
   * Update an account by username
   * @param username The username to update
   * @param data The data to update
   * @returns Promise<Account> The updated account
   */
  async updateByUsername(
    username: string,
    data: Prisma.AccountUpdateManyMutationInput,
  ): Promise<Account> {
    return await this.prisma.account.update({
      where: { username },
      data,
    });
  }

  /**
   * Create or update an account (upsert)
   * @param username The username to upsert
   * @param createData Data for creating if doesn't exist
   * @param updateData Data for updating if exists
   * @returns Promise<Account> The created or updated account
   */
  async upsert(
    data: Omit<Account, "id" | "created_at" | "updated_at">,
  ): Promise<Account> {
    return await this.prisma.account.upsert({
      where: { username: data.username },
      create: data,
      update: data,
    });
  }

  /**
   * Delete an account by ID
   * @param id The account ID to delete
   * @returns Promise<Account> The deleted account
   */
  async delete(id: string): Promise<Account> {
    return await this.prisma.account.delete({
      where: { id },
    });
  }

  /**
   * Delete an account by username
   * @param username The username to delete
   * @returns Promise<Account> The deleted account
   */
  async deleteByUsername(username: string): Promise<Account> {
    return await this.prisma.account.delete({
      where: { username },
    });
  }

  /**
   * List accounts with pagination
   * @param skip Number of records to skip
   * @param take Number of records to take
   * @returns Promise<Account[]> Array of accounts
   */
  async list(skip = 0, take = 10): Promise<Account[]> {
    return await this.prisma.account.findMany({
      skip,
      take,
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Count total accounts
   * @returns Promise<number> Total count of accounts
   */
  async count(): Promise<number> {
    return await this.prisma.account.count();
  }
}
