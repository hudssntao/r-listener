import type {
  Prisma,
  PrismaClient,
  Restaurant,
} from "../../../generated/prisma/index.js";

export class RestaurantDao {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new restaurant
   * @param data Restaurant data to create
   * @returns Promise<Restaurant> The created restaurant
   */
  async create(data: Prisma.RestaurantCreateManyInput): Promise<Restaurant> {
    return await this.prisma.restaurant.create({
      data: {
        account_id: data.account_id,
      },
    });
  }

  /**
   * Find a restaurant by ID
   * @param id The restaurant ID to search for
   * @returns Promise<Restaurant | null> The restaurant if found, null otherwise
   */
  async findById(id: string): Promise<Restaurant | null> {
    return await this.prisma.restaurant.findUnique({
      where: { id },
      include: { account: true },
    });
  }

  /**
   * Find a restaurant by account ID
   * @param accountId The account ID to search for
   * @returns Promise<Restaurant | null> The restaurant if found, null otherwise
   */
  async findByAccountId(accountId: string): Promise<Restaurant | null> {
    return await this.prisma.restaurant.findUnique({
      where: { account_id: accountId },
      include: { account: true },
    });
  }

  /**
   * Find a restaurant by account username
   * @param username The account username to search for
   * @returns Promise<Restaurant | null> The restaurant if found, null otherwise
   */
  async findByUsername(username: string): Promise<Restaurant | null> {
    return await this.prisma.restaurant.findFirst({
      where: {
        account: {
          username,
        },
      },
      include: { account: true },
    });
  }

  /**
   * Update a restaurant
   * @param id The restaurant ID to update
   * @param data The data to update
   * @returns Promise<Restaurant> The updated restaurant
   */
  async update(
    id: string,
    data: Prisma.RestaurantUpdateManyMutationInput,
  ): Promise<Restaurant> {
    return await this.prisma.restaurant.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a restaurant by ID
   * @param id The restaurant ID to delete
   * @returns Promise<Restaurant> The deleted restaurant
   */
  async delete(id: string): Promise<Restaurant> {
    return await this.prisma.restaurant.delete({
      where: { id },
    });
  }

  /**
   * Delete a restaurant by account ID
   * @param accountId The account ID to delete restaurant for
   * @returns Promise<Restaurant> The deleted restaurant
   */
  async deleteByAccountId(accountId: string): Promise<Restaurant> {
    return await this.prisma.restaurant.delete({
      where: { account_id: accountId },
    });
  }

  /**
   * List restaurants with pagination
   * @param skip Number of records to skip
   * @param take Number of records to take
   * @returns Promise<Restaurant[]> Array of restaurants with their accounts
   */
  async list(skip = 0, take = 10): Promise<Restaurant[]> {
    return await this.prisma.restaurant.findMany({
      skip,
      take,
      include: { account: true },
      orderBy: { account: { created_at: "desc" } },
    });
  }

  /**
   * Count total restaurants
   * @returns Promise<number> Total count of restaurants
   */
  async count(): Promise<number> {
    return await this.prisma.restaurant.count();
  }
}
