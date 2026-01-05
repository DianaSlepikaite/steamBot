import { GameModel, UserGameModel } from '../database/models';

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url?: string;
}

export interface FetchGamesResult {
  success: boolean;
  isPrivate: boolean;
  gamesCount: number;
  error?: string;
}

/**
 * Resolves a Steam vanity URL or custom ID to a SteamID64 using direct API calls
 */
export async function resolveSteamId(input: string): Promise<string | null> {
  try {
    console.log(`[Steam Resolve] Input: ${input}`);

    // Check if input is already a SteamID64 (17 digits)
    if (/^\d{17}$/.test(input)) {
      console.log(`[Steam Resolve] Input is already a SteamID64`);
      return input;
    }

    // Try to extract from profile URL
    const urlMatch = input.match(/steamcommunity\.com\/(profiles|id)\/([^\/]+)/);
    if (urlMatch) {
      const [, type, identifier] = urlMatch;
      console.log(`[Steam Resolve] Extracted from URL - type: ${type}, identifier: ${identifier}`);

      if (type === 'profiles' && identifier) {
        // Already a SteamID64
        console.log(`[Steam Resolve] URL contains SteamID64 directly`);
        return identifier;
      } else if (identifier && type === 'id') {
        // Vanity URL, need to resolve
        console.log(`[Steam Resolve] Resolving vanity URL: ${identifier}`);
        return await resolveVanityUrl(identifier);
      }
    }

    // Assume it's a vanity name without URL
    console.log(`[Steam Resolve] Treating as vanity name: ${input}`);
    return await resolveVanityUrl(input);
  } catch (error: any) {
    console.error('[Steam Resolve] Error:', error.message);
    return null;
  }
}

/**
 * Helper function to resolve a vanity URL to SteamID64 using direct API call
 */
async function resolveVanityUrl(vanityName: string): Promise<string | null> {
  try {
    const apiKey = process.env.STEAM_API_KEY;
    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${vanityName}`;

    console.log(`[Steam Resolve] Calling ResolveVanityURL API for: ${vanityName}`);

    const response = await fetch(url);
    console.log(`[Steam Resolve] API response status: ${response.status}`);

    if (!response.ok) {
      console.error(`[Steam Resolve] HTTP error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: any = await response.json();
    console.log(`[Steam Resolve] API response:`, data);

    if (data.response?.success === 1 && data.response?.steamid) {
      console.log(`[Steam Resolve] Successfully resolved to: ${data.response.steamid}`);
      return data.response.steamid;
    } else {
      console.log(`[Steam Resolve] Could not resolve vanity URL. Response success: ${data.response?.success}`);
      return null;
    }
  } catch (error: any) {
    console.error(`[Steam Resolve] Error in resolveVanityUrl:`, error.message);
    return null;
  }
}

/**
 * Fetches owned games for a Steam user and stores them in the database
 */
export async function fetchAndStoreGames(
  discordId: string,
  guildId: string,
  steamId: string
): Promise<FetchGamesResult> {
  try {
    console.log(`[Steam API] Fetching games for Steam ID: ${steamId}`);
    console.log(`[Steam API] Using API key: ${process.env.STEAM_API_KEY ? process.env.STEAM_API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);

    // Use direct fetch instead of steamapi library (it has issues with API key handling)
    const apiKey = process.env.STEAM_API_KEY;
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&format=json`;

    console.log(`[Steam API] Fetching from URL (key hidden)`);

    const response = await fetch(url);
    console.log(`[Steam API] Response status: ${response.status} ${response.statusText}`);

    if (response.status === 401) {
      console.error(`[Steam API] 401 Unauthorized - API key is invalid`);
      return {
        success: false,
        isPrivate: false,
        gamesCount: 0,
        error: 'Invalid Steam API key. Please check your STEAM_API_KEY in .env'
      };
    }

    if (response.status === 403) {
      console.log(`[Steam API] 403 Forbidden - Profile is private`);
      return {
        success: false,
        isPrivate: true,
        gamesCount: 0,
        error: 'This Steam profile is private.'
      };
    }

    if (!response.ok) {
      console.error(`[Steam API] HTTP error: ${response.status}`);
      return {
        success: false,
        isPrivate: false,
        gamesCount: 0,
        error: `Steam API error: ${response.statusText}`
      };
    }

    const data: any = await response.json();
    const games = data.response?.games || [];

    console.log(`[Steam API] Received response. Games count: ${games.length}`);

    if (games.length === 0) {
      console.log(`[Steam API] Empty response. Profile may be private or have no games.`);

      // Check if user already has games stored
      const existingGameCount = UserGameModel.getUserGameCount(discordId, guildId);

      if (existingGameCount > 0) {
        console.log(`[Steam API] User has ${existingGameCount} games stored. Not wiping due to likely privacy setting.`);
        return {
          success: false,
          isPrivate: true,
          gamesCount: existingGameCount,
          error: 'keepExisting' // Special flag to indicate we're keeping existing data
        };
      }

      return {
        success: false,
        isPrivate: true,
        gamesCount: 0,
        error: 'Unable to fetch games. Profile may be private or have no games.'
      };
    }

    // Clear existing games for this user in this guild
    UserGameModel.deleteAllForUser(discordId, guildId);

    // Store games in database
    for (const game of games) {
      // Store game info
      const iconUrl = game.img_icon_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
        : undefined;

      GameModel.createOrUpdate(game.appid, game.name, iconUrl);

      // Store user-game relationship
      UserGameModel.create(discordId, guildId, game.appid, game.playtime_forever || 0);
    }

    return {
      success: true,
      isPrivate: false,
      gamesCount: games.length
    };
  } catch (error: any) {
    console.error('[Steam API] ERROR fetching games:', error.message);
    console.error('[Steam API] Full error:', error);
    console.error('[Steam API] Error stack:', error.stack);

    // Check if error is due to privacy settings
    if (error.message.includes('private') || error.message.includes('403')) {
      console.log('[Steam API] Error identified as privacy issue');

      return {
        success: false,
        isPrivate: true,
        gamesCount: 0,
        error: 'This Steam profile is private.'
      };
    }

    console.log('[Steam API] Error identified as general API error');
    return {
      success: false,
      isPrivate: false,
      gamesCount: 0,
      error: `Failed to fetch games: ${error.message}`
    };
  }
}

/**
 * Format playtime from minutes to a readable string
 */
export function formatPlaytime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}
