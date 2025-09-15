import type {
  Account,
  Influencer,
  Restaurant,
} from "../../../generated/prisma/index.js";
import type { AccountDao } from "../dao/account.dao.js";
import type { InfluencerDao } from "../dao/influencer.dao.js";
import type { RestaurantDao } from "../dao/restaurant.dao.js";

export class AccountService {
  constructor(
    private account_dao: AccountDao,
    private influencer_dao: InfluencerDao,
    private restaurant_dao: RestaurantDao,
  ) {}

  /**
   * Upsert an account and its related child table based on Instagram profile data
   * @param profileData The Instagram profile data from the schema
   * @returns Promise<{ account: Account; influencer?: Influencer; restaurant?: Restaurant }>
   */
  async upsertProfile(
    profile_data: {
      profile_type: "INFLUENCER" | "RESTAURANT" | "OTHER";
    } & Omit<Account, "id" | "created_at" | "updated_at">,
  ): Promise<{
    account: Account;
    influencer?: Influencer;
    restaurant?: Restaurant;
  }> {
    const { profile_type, ...account_data } = profile_data;

    const account = await this.account_dao.upsert(account_data);

    const result: {
      account: Account;
      influencer?: Influencer;
      restaurant?: Restaurant;
    } = { account };

    switch (profile_type) {
      case "INFLUENCER": {
        let influencer = await this.influencer_dao.findByAccountId(account.id);
        if (!influencer) {
          influencer = await this.influencer_dao.create({
            account_id: account.id,
          });
        }
        result.influencer = influencer;
        break;
      }
      case "RESTAURANT": {
        let restaurant = await this.restaurant_dao.findByAccountId(account.id);
        if (!restaurant) {
          restaurant = await this.restaurant_dao.create({
            account_id: account.id,
          });
        }
        result.restaurant = restaurant;
        break;
      }
      default: {
        break;
      }
    }

    return result;
  }
}
