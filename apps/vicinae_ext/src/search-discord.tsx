import {
  Action,
  ActionPanel,
  closeMainWindow,
  Color,
  Image,
  List,
} from "@vicinae/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createWsClient } from "./lib/ws";

import { ClientType } from "@rainworkflow/types/src/clients";
import {
  AnyEvent,
  EventKeys,
  MessageType,
  RequestEvent,
  RequestTypeEventKeys,
  ResponseTypeData,
} from "@rainworkflow/types/src/events";

// has to be import type, or itll also bundle Vencord's source in the build for this module
import type { SearchResultItem } from "../../../../../tests/Vencord/src/userplugins/vicinaeIPC";

type SearchResultData = ResponseTypeData["search"];

type GroupedResults = {
  header?: string;
  items: SearchResultItem[];
}[];

function searchEvent(query: string): RequestEvent<typeof EventKeys.SEARCH> {
  return {
    $interactionId: `vencord_search_${Date.now()}`,
    $type: MessageType.REQUEST,
    $client: ClientType.VICINAE,
    $event: EventKeys.SEARCH,
    data: {
      query: query,
    },
  };
}

function sendEvent(
  ws: WebSocket,
  event: RequestEvent<RequestTypeEventKeys>
): void {
  ws.send(JSON.stringify(event));
}

export default function ControlledList() {
  const ws = useMemo(() => createWsClient(), []);

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] =
    useState<SearchResultData["results"]>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Track the latest interaction ID to ignore stale responses
  const latestInteractionIdRef = useRef<string>("");

  const performSearch = useCallback(
    (queryStr: string) => {
      setIsLoading(true);
      const evtData = searchEvent(queryStr);
      latestInteractionIdRef.current = evtData.$interactionId;
      sendEvent(ws, evtData);
    },
    [ws]
  );

  useEffect(() => {
    const sendInitialMessage = () => {
      performSearch("");
    };

    ws.onopen = sendInitialMessage;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as AnyEvent;

      if (
        data.$type === MessageType.RESPONSE &&
        data.$event === EventKeys.SEARCH &&
        data.$interactionId === latestInteractionIdRef.current
      ) {
        setSearchResults(data.data.results);
        setIsLoading(false);
      }
    };
    return () => {
      ws.onopen = null;
    };
  }, [ws, performSearch]);

  const handleSearchChange = useCallback(
    (queryStr: string) => {
      // Update UI immediately for responsiveness
      setSearchText(queryStr);
      performSearch(queryStr);
    },
    [performSearch]
  );

  // Group results by header items
  const groupedResults = useMemo<GroupedResults>(() => {
    if (!searchResults) return [];

    const groups: GroupedResults = [];
    let currentGroup: { header?: string; items: SearchResultItem[] } = {
      items: [],
    };

    for (const result of searchResults) {
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
  }, [searchResults]);

  async function handleOpenTarget(target: SearchResultItem) {
    // close vicinae
    closeMainWindow({
      clearRootSearch: true,
    });

    // send focus event to workflow server
    sendEvent(ws, {
      $type: MessageType.REQUEST,
      $interactionId: `vencord_focus_${Date.now()}`,
      $client: ClientType.VICINAE,
      $event: EventKeys.OPEN_DISCORD_TARGET,
      data: {
        target,
      },
    });
  }

  return (
    <List
      searchText={searchText}
      onSearchTextChange={handleSearchChange}
      searchBarPlaceholder={"Search Discord..."}
      isLoading={isLoading}
      throttle
    >
      {groupedResults.length === 0 ? (
        <List.Section title={"Discord"}>
          {/* Empty state handled by List component */}
        </List.Section>
      ) : (
        groupedResults.map((group, groupIndex) => (
          <List.Section
            key={group.header ?? `group-${groupIndex}`}
            title={group.header ?? "Discord"}
          >
            {group.items.map((result) => {
              const targetName =
                result.type === "USER"
                  ? `@${result.record.username}`
                  : result.type === "TEXT_CHANNEL"
                  ? `#${result.record.name}`
                  : result.type === "VOICE_CHANNEL"
                  ? `🔊 ${result.record.name}`
                  : result.record.name;

              const itemEntry = makeResultItemEntry(result);

              const icon = itemEntry.icon
                ? {
                    source: itemEntry.icon,
                    mask: Image.Mask.Circle,
                  }
                : itemEntry.guildIcon && result.type === "GUILD"
                ? {
                    source: itemEntry.guildIcon,
                    mask: Image.Mask.RoundedRectangle,
                  }
                : undefined;

              return (
                <List.Item
                  key={itemEntry.key}
                  title={itemEntry.title}
                  subtitle={itemEntry.subtitle}
                  icon={icon}
                  accessories={[
                    ...(itemEntry.guild
                      ? [
                          {
                            text: itemEntry.guild,
                            icon: itemEntry.guildIcon
                              ? {
                                  source: itemEntry.guildIcon,
                                  mask: Image.Mask.RoundedRectangle,
                                }
                              : undefined,
                          },
                        ]
                      : []),
                    ...(itemEntry.isUnread
                      ? [
                          {
                            tag: {
                              color: Color.SecondaryText,
                              value: "Unread",
                            },
                          },
                        ]
                      : []),
                    ...(itemEntry.mentions
                      ? [
                          {
                            tag: {
                              color: Color.Red,
                              value: `🔔 ${itemEntry.mentions}`,
                            },
                          },
                        ]
                      : []),
                  ]}
                  actions={
                    <ActionPanel>
                      <ActionPanel.Section>
                        <Action
                          title={`Open ${targetName}`}
                          onAction={() => {
                            handleOpenTarget(result);
                          }}
                        />
                      </ActionPanel.Section>
                    </ActionPanel>
                  }
                />
              );
            })}
          </List.Section>
        ))
      )}
    </List>
  );
}

type ResultItemEntry = {
  key: string;
  title: string;
  subtitle?: string;
  icon?: string;
  guild?: string;
  guildIcon?: string;
  isUnread?: boolean;
  mentions?: number;
};

function makeResultItemEntry(result: SearchResultItem): ResultItemEntry {
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
