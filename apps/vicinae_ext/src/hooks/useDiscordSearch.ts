import {
  EventKeys,
  MessageType,
  type AnyEvent,
  type ResponseTypeData,
} from "@rainworkflow/types/src/events";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSearchEvent, sendEvent } from "../utils/events";
import { useWebSocket } from "./useWebSocket";

export function useDiscordSearch() {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] =
    useState<ResponseTypeData["search"]["results"]>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // track latest interaction ID to ignore stale responses
  const latestInteractionIdRef = useRef<string>("");

  const performSearch = useCallback((queryStr: string) => {
    setIsLoading(true);
    const evtData = createSearchEvent(queryStr);
    latestInteractionIdRef.current = evtData.$interactionId;
    return evtData;
  }, []);

  const handleMessage = useCallback((data: AnyEvent) => {
    if (
      data.$type === MessageType.RESPONSE &&
      data.$event === EventKeys.SEARCH &&
      data.$interactionId === latestInteractionIdRef.current
    ) {
      setSearchResults(data.data.results);
      setIsLoading(false);
    }
  }, []);

  const ws = useWebSocket(handleMessage);

  // send initial search on connection
  useEffect(() => {
    const sendInitialMessage = () => {
      const evtData = performSearch("");
      sendEvent(ws, evtData);
    };

    ws.onopen = sendInitialMessage;
    return () => {
      ws.onopen = null;
    };
  }, [ws, performSearch]);

  const handleSearchChange = useCallback(
    (queryStr: string) => {
      setSearchText(queryStr);
      const evtData = performSearch(queryStr);
      sendEvent(ws, evtData);
    },
    [performSearch, ws]
  );

  return {
    searchText,
    searchResults,
    isLoading,
    handleSearchChange,
    ws,
  };
}
