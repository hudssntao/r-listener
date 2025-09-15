export const INSTAGRAM_PROFILE_PROMPT = `Analyze this Instagram profile screenshot and extract the following information. 
    Look carefully at the profile section which typically shows:
    - Username (handle starting with @)
    - Display name (full name shown on profile)
    - Bio/description text
    - Follower count (number of followers)
    - Following count (number of people they follow)
    - Verification status (blue checkmark)
    
    For demographic & profile typeanalysis, make educated guesses based on:
    - Profile photo appearance
    - Name patterns
    - Bio content
    - Content style
    
    Respond in JSON format with the following fields:
    
    {
      "username": "string - Instagram handle without @ symbol",
      "display_name": "string - Full display name shown on profile",
      "bio": "string - Profile bio/description text",
      "follower_count": "number|null - Number of followers, null if not visible",
      "following_count": "number|null - Number following, null if not visible", 
      "is_verified": "boolean - True if profile has blue checkmark",
      "ethnicity": "string|null - Estimated ethnicity: ASIAN, BLACK, HISPANIC, MIDDLE_EASTERN, NATIVE_AMERICAN, PACIFIC_ISLANDER, or WHITE",
      "gender": "string|null - Estimated gender: MALE or FEMALE",
      "age_group": "string|null - Estimated age group: YOUNG_ADULT, MIDDLE_AGED, or SENIOR"
      "profile_type": "string - Estimated profile type: INFLUENCER, RESTAURANT, OTHER"
    }

    Make sure to return valid JSON that matches this exact structure.`;

export const COMMENT_SECTION_PROMPT = `Carefully analyze this screen recording of a comments section and extract the following information. 
    Look carefully at the comment section which typically shows:
    - Comment text
    - Commenter username
    - Relative timestamp of the comment
    - Like count
    - Reply count
    
    
    Respond in following format with the following fields:
    
    {
      "comments": [
        {
          "text": "string - Comment text. Make sure to truncate repeated characters/words/emojis",
          "username": "string - Commenter username",
          "uploaded_at": {
            // This is the relative timestamp of the comment, converted into a normalized format.
            "unit": "string - Time unit (e.g., second, minute, hour, day, week, month, year)",
            "value": "number - Numeric value of the time unit"
          },
          "like_count": "number - Like count",
          "reply_count": "number - Reply count (0 if not visible)"
        }
      ]
    }

    Make sure to return valid JSON that matches this exact structure.
    `;
