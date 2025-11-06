/**
 * Utility to check if games support multiplayer and get player counts
 */

export interface MultiplayerInfo {
  isMultiplayer: boolean;
  maxPlayers?: number;
  coopPlayers?: number;
  multiplayerType?: string; // e.g., "Online Co-op", "Local Multiplayer"
}

const multiplayerCache = new Map<number, MultiplayerInfo>();

/**
 * Get multiplayer information for a game using Steam Store API
 */
export async function getMultiplayerInfo(appId: number): Promise<MultiplayerInfo> {
  // Check cache first
  if (multiplayerCache.has(appId)) {
    return multiplayerCache.get(appId)!;
  }

  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.log(`[Multiplayer Check] Failed to fetch details for app ${appId}`);
      return { isMultiplayer: false };
    }

    const data: any = await response.json();

    if (!data[appId]?.success || !data[appId]?.data) {
      console.log(`[Multiplayer Check] No data for app ${appId}`);
      return { isMultiplayer: false };
    }

    const gameData = data[appId].data;
    const categories = gameData.categories || [];

    // Category IDs and their descriptions
    const categoryMap: { [key: number]: { name: string; isCoop?: boolean } } = {
      1: { name: 'Multi-player' },
      9: { name: 'Co-op', isCoop: true },
      27: { name: 'Cross-Platform Multiplayer' },
      36: { name: 'Online Co-op', isCoop: true },
      37: { name: 'Local Co-op', isCoop: true },
      38: { name: 'Online Multi-Player' },
      39: { name: 'Local Multi-Player' },
      24: { name: 'Shared/Split Screen Co-op', isCoop: true },
    };

    const multiplayerCategoryIds = Object.keys(categoryMap).map(Number);

    // Find matching multiplayer categories
    const matchedCategories = categories.filter((cat: any) =>
      multiplayerCategoryIds.includes(cat.id)
    );

    if (matchedCategories.length === 0) {
      const info = { isMultiplayer: false };
      multiplayerCache.set(appId, info);
      return info;
    }

    // Extract player counts from category descriptions
    let maxPlayers: number | undefined;
    let coopPlayers: number | undefined;
    const multiplayerTypes: string[] = [];

    matchedCategories.forEach((cat: any) => {
      const categoryInfo = categoryMap[cat.id];
      if (categoryInfo) {
        multiplayerTypes.push(categoryInfo.name);
      }

      // Try to extract player count from description
      // Examples: "Multi-player", "Online Co-Op (2-4)", "Local Co-op (2)"
      const description = cat.description || '';
      const playerMatch = description.match(/\((\d+)(?:-(\d+))?\)/);

      if (playerMatch) {
        const min = parseInt(playerMatch[1]);
        const max = playerMatch[2] ? parseInt(playerMatch[2]) : min;

        if (categoryInfo?.isCoop) {
          coopPlayers = Math.max(coopPlayers || 0, max);
        } else {
          maxPlayers = Math.max(maxPlayers || 0, max);
        }
      }
    });

    // If no explicit player count, try to get from game details
    if (!maxPlayers && !coopPlayers) {
      // Some games have player count in supported_languages or other fields
      // Check if there's a "players" field (uncommon but exists)
      if (gameData.players) {
        maxPlayers = gameData.players;
      }
    }

    const info: MultiplayerInfo = {
      isMultiplayer: true,
      ...(maxPlayers !== undefined && { maxPlayers }),
      ...(coopPlayers !== undefined && { coopPlayers }),
      ...(multiplayerTypes.length > 0 && { multiplayerType: multiplayerTypes.join(', ') }),
    };

    // Cache the result
    multiplayerCache.set(appId, info);

    return info;
  } catch (error: any) {
    console.error(`[Multiplayer Check] Error checking app ${appId}:`, error.message);
    // On error, assume it might be multiplayer to avoid filtering out too many games
    return { isMultiplayer: true };
  }
}

/**
 * Backward compatibility: Check if a game is multiplayer
 */
export async function isMultiplayerGame(appId: number): Promise<boolean> {
  const info = await getMultiplayerInfo(appId);
  return info.isMultiplayer;
}

export interface GameWithMultiplayerInfo {
  app_id: number;
  name: string;
  multiplayerInfo: MultiplayerInfo;
}

/**
 * Filter a list of games to only include multiplayer games with player count info
 * Processes games in batches to avoid rate limiting
 */
export async function filterMultiplayerGames(
  games: { app_id: number; name: string }[]
): Promise<GameWithMultiplayerInfo[]> {
  const multiplayerGames: GameWithMultiplayerInfo[] = [];

  console.log(`[Multiplayer Filter] Checking ${games.length} games for multiplayer support...`);

  // Process in batches of 5 with delays to avoid rate limiting
  const batchSize = 5;
  const delayMs = 1000; // 1 second between batches

  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(async game => ({
        game,
        multiplayerInfo: await getMultiplayerInfo(game.app_id)
      }))
    );

    // Add multiplayer games to result
    results.forEach(({ game, multiplayerInfo }) => {
      if (multiplayerInfo.isMultiplayer) {
        multiplayerGames.push({
          ...game,
          multiplayerInfo
        });
      }
    });

    // Delay between batches (except for last batch)
    if (i + batchSize < games.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`[Multiplayer Filter] Found ${multiplayerGames.length} multiplayer games out of ${games.length}`);

  return multiplayerGames;
}
