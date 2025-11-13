import type {
  ResponseTypeData,
  SearchResultItem,
} from "@rainworkflow/types/src/events";

export type GroupedResults = {
  header?: string;
  items: SearchResultItem[];
}[];

export function groupSearchResults(
  results: ResponseTypeData["search"]["results"]
): GroupedResults {
  if (!results) return [];

  // We'll merge all detected groups (by header name).
  // Use a Map<string | undefined, SearchResultItem[]> to accumulate items per header.
  const groupMap = new Map<string | undefined, SearchResultItem[]>();
  let currentHeader: string | undefined = undefined;

  for (const result of results) {
    if (result.type === "HEADER") {
      // New current group header
      const headerRecord = result.record as { text: string };
      currentHeader = headerRecord.text;
      // Ensure the group exists in the map
      if (!groupMap.has(currentHeader)) {
        groupMap.set(currentHeader, []);
      }
    } else {
      // Push item to the group keyed by the current header.
      if (!groupMap.has(currentHeader)) {
        groupMap.set(currentHeader, []);
      }
      groupMap.get(currentHeader)!.push(result);
    }
  }

  // Build the array of grouped results, sorting items by descending score
  const groups: GroupedResults = [];
  for (const [header, items] of groupMap) {
    if (items.length > 0) {
      groups.push({
        header,
        items: items.slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
      });
    }
  }

  return groups;
}

export type ResultItemEntry = {
  key: string;
  title: string;
  subtitle?: string;
  currentUser?: {
    username: string;
    avatarURL: string;
  };
  icon?: string;
  guild?: string;
  guildIcon?: string;
  isUnread?: boolean;
  mentions?: number;
};

export function createResultItemEntry(
  result: SearchResultItem
): ResultItemEntry {
  let entryObj: ResultItemEntry = {
    key: `${result.type}-${
      "id" in result.record ? result.record.id : result.record.name
    }-${result.score.toString()}`,
    title:
      result.type === "USER"
        ? `@${result.record.username}`
        : result.type === "TEXT_CHANNEL"
        ? `#${result.record.name}`
        : result.type === "VOICE_CHANNEL"
        ? `🔊 ${result.record.name}`
        : result.record.name,
    isUnread: result.metadata?.unread,
    mentions: result.metadata?.mentions,
    icon: result.metadata?.userIconURL,
    guildIcon: result.metadata?.guildIconURL,
    currentUser: result.metadata?.currentUser
      ? {
          username: result.metadata.currentUser.username,
          avatarURL: result.metadata.currentUser.avatar,
        }
      : undefined,
  };

  switch (result.type) {
    case "TEXT_CHANNEL":
    case "VOICE_CHANNEL":
      const guildName = result.metadata?.guild?.name;
      const categoryName = result.metadata?.category?.name;

      return {
        ...entryObj,
        guild: guildName ?? "Unknown guild",
        subtitle: categoryName,
      };
    case "GUILD":
      return {
        ...entryObj,
        subtitle: "Server",
      };
  }

  return entryObj;
}

export function getTargetName(result: SearchResultItem): string {
  if (result.type === "USER") {
    return `@${result.record.username}`;
  }
  if (result.type === "TEXT_CHANNEL") {
    return `#${result.record.name}`;
  }
  if (result.type === "VOICE_CHANNEL") {
    return `🔊 ${result.record.name}`;
  }
  return result.record.name;
}
