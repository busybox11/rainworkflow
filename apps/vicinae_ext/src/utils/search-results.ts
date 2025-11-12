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

  const groups: GroupedResults = [];
  let currentGroup: { header?: string; items: SearchResultItem[] } = {
    items: [],
  };

  for (const result of results) {
    if (result.type === "HEADER") {
      // If we have items in the current group, save it
      if (currentGroup.items.length > 0) {
        groups.push(currentGroup);
      }
      // Start a new group with this header
      // Type assertion: when type is HEADER, record is SearchResultHeaderItem
      const headerRecord = result.record as { text: string };
      currentGroup = {
        header: headerRecord.text,
        items: [],
      };
    } else {
      // Add item to current group
      currentGroup.items.push(result);
    }
  }

  // Add the last group if it has items
  if (currentGroup.items.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export type ResultItemEntry = {
  key: string;
  title: string;
  subtitle?: string;
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
