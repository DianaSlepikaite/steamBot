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

    // Try multiple sources for player count data
    if (!maxPlayers && !coopPlayers) {
      // Method 1: Check Steam community hub for multiplayer info
      try {
        const hubUrl = `https://steamcommunity.com/app/${appId}`;
        const hubResponse = await fetch(hubUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (hubResponse.ok) {
          const html = await hubResponse.text();

          // Look for common player count patterns in the page
          // Examples: "2-4 players", "Up to 8 players", "4 player co-op"
          const patterns = [
            /(\d+)-(\d+)\s*players?/i,
            /up to (\d+)\s*players?/i,
            /(\d+)\s*player\s*co-?op/i,
            /co-?op.*?(\d+)\s*players?/i,
          ];

          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
              // Get the highest number found
              const nums = match.slice(1).filter(n => n).map(n => parseInt(n));
              const maxNum = Math.max(...nums);

              if (match[0].toLowerCase().includes('co-op') || match[0].toLowerCase().includes('coop')) {
                coopPlayers = maxNum;
              } else {
                maxPlayers = maxNum;
              }
              break;
            }
          }
        }
      } catch (error) {
        // Continue to next method
      }
    }

    // Method 2: Use known popular games database (hardcoded for common games)
    if (!maxPlayers && !coopPlayers) {
      const knownGames: { [key: number]: { coop?: number; max?: number } } = {
        // Popular multiplayer games with known player counts
        892970: { coop: 10 },  // Valheim
        648800: { coop: 8 },   // Raft
        322330: { coop: 6 },   // Don't Starve Together
        550: { coop: 4 },      // Left 4 Dead 2
        70: { max: 32 },       // Half-Life
        4000: { max: 32 },     // Garry's Mod
        271590: { max: 250 },  // Grand Theft Auto V
        252490: { coop: 4 },   // Rust
        230410: { coop: 4 },   // Warframe
        105600: { coop: 8 },   // Terraria
        280: { max: 32 },      // Half-Life: Source
        240: { max: 32 },      // Counter-Strike: Source
        10: { max: 32 },       // Counter-Strike
        730: { max: 10 },      // Counter-Strike 2
        440: { max: 24 },      // Team Fortress 2
        570: { max: 10 },      // Dota 2
        304930: { coop: 4 },   // Unturned
        413150: { coop: 4 },   // Stardew Valley
        294100: { coop: 4 },   // RimWorld
        261550: { coop: 4 },   // Mount & Blade II: Bannerlord
        236850: { coop: 4 },   // Europa Universalis IV
        552520: { coop: 6 },   // Oxygen Not Included
        548430: { coop: 4 },   // Deep Rock Galactic
        289070: { coop: 6 },   // Sid Meier's Civilization VI
        39140: { max: 64 },    // Serious Sam 3
        1203220: { coop: 4 },  // NARAKA: BLADEPOINT
        620: { coop: 2 },      // Portal 2
        214950: { coop: 2 },   // Total War: ROME II
        1245620: { coop: 3 }, // ELDEN RING
        359550: { max: 10 },   // Rainbow Six Siege
        346110: { coop: 100 },   // ARK: Survival Evolved
        251570: { coop: 8 },   // 7 Days to Die
        427520: { max: 65535 },  // Factorio
        242760: { coop: 8 },   // The Forest
        221100: { max: 60 },   // DayZ
        578080: { max: 100 },  // PLAYERUNKNOWN'S BATTLEGROUNDS
        1172470: { max: 60 },  // Apex Legends
        1240440: { max: 24 },  // Halo Infinite
        8930: { coop: 12 },     // Sid Meier's Civilization V
        231430: { coop: 8 },   // Company of Heroes 2
        65800: { coop: 4 },    // Dungeon Defenders
        49520: { coop: 4 },    // Borderlands 2
        8980: { coop: 4 },     // Borderlands GOTY
        32440: { coop: 6 },    // DARK SOULS II
        335300: { coop: 6 },   // DARK SOULS II: Scholar of the First Sin
        374320: { coop: 6 },   // DARK SOULS III
        442070: { coop: 8 },   // Drawful 2
        219640: { max: 32 },   // Chivalry: Medieval Warfare
        360: { max: 32 },      // Half-Life Deathmatch: Source
        40: { max: 32 },       // Half-Life: Deathmatch
        320: { max: 32 },      // Half-Life 2: Deathmatch
        80: { max: 32 },       // Counter-Strike: Condition Zero
        1086940: { coop: 4 },   // Baldur's Gate 3
      };

      const known = knownGames[appId];
      if (known) {
        coopPlayers = known.coop;
        maxPlayers = known.max;
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
