import { Action, ActionPanel, closeMainWindow, List } from "@vicinae/api";
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
import { SearchResultItem } from "../../../../../tests/Vencord/packages/vencord-types/src/userplugins/vicinaeIPC";

type SearchResultData = ResponseTypeData["search"];

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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

      // Clear any pending debounced search
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce the actual search
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(queryStr);
      }, 100);
    },
    [performSearch]
  );

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <List
      searchText={searchText}
      onSearchTextChange={handleSearchChange}
      searchBarPlaceholder={"Search Discord..."}
      isLoading={isLoading}
    >
      <List.Section title={"Discord"}>
        {searchResults?.map((result) => {
          if (result.score < 2000) return;

          const targetName =
            result.type === "USER"
              ? `@${result.record.username}`
              : result.type === "TEXT_CHANNEL"
              ? `#${result.record.name}`
              : result.type === "VOICE_CHANNEL"
              ? `🔊 ${result.record.name}`
              : result.record.name;

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
                target: target,
              },
            });
          }

          return (
            <List.Item
              key={`${result.type}-${result.id}-${result.score.toString()}`}
              title={targetName}
              subtitle={result.type}
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
    </List>
  );
}
