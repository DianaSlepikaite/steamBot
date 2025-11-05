import SteamAPI from 'steamapi';
import { GameModel, UserGameModel } from '../database/models';

const steam = new SteamAPI(process.env.STEAM_API_KEY || '');

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
 * Resolves a Steam vanity URL or custom ID to a SteamID64
 */
export async function resolveSteamId(input: string): Promise<string | null> {
  try {
    // Check if input is already a SteamID64 (17 digits)
    if (/^\d{17}$/.test(input)) {
      return input;
    }

    // Try to extract from profile URL
    const urlMatch = input.match(/steamcommunity\.com\/(profiles|id)\/([^\/]+)/);
    if (urlMatch) {
      const [, type, identifier] = urlMatch;

      if (type === 'profiles' && identifier) {
        // Already a SteamID64
        return identifier;
      } else if (identifier) {
        // Vanity URL, need to resolve
        const steamId = await steam.resolve(identifier);
        return steamId || null;
      }
    }

    // Assume it's a vanity name
    const steamId = await steam.resolve(input);
    return steamId || null;
  } catch (error: any) {
    console.error('Error resolving Steam ID:', error.message);
    return null;
  }
}

/**
 * Fetches owned games for a Steam user and stores them in the database
 */
export async function fetchAndStoreGames(
  discordId: string,
  steamId: string
): Promise<FetchGamesResult> {
  try {
    // Fetch games from Steam API
    const games: any = await steam.getUserOwnedGames(steamId);

    if (!games || games.length === 0) {
      // Could be empty library or private profile
      return {
        success: false,
        isPrivate: true,
        gamesCount: 0,
        error: 'Unable to fetch games. Profile may be private or have no games.'
      };
    }

    // Clear existing games for this user
    UserGameModel.deleteAllForUser(discordId);

    // Store games in database
    for (const game of games) {
      // Store game info
      const iconUrl = game.img_icon_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
        : undefined;

      GameModel.createOrUpdate(game.appid, game.name, iconUrl);

      // Store user-game relationship
      UserGameModel.create(discordId, game.appid, game.playtime_forever || 0);
    }

    return {
      success: true,
      isPrivate: false,
      gamesCount: games.length
    };
  } catch (error: any) {
    console.error('Error fetching Steam games:', error.message);

    // Check if error is due to privacy settings
    if (error.message.includes('private') || error.message.includes('403')) {
      return {
        success: false,
        isPrivate: true,
        gamesCount: 0,
        error: 'This Steam profile is private.'
      };
    }

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
