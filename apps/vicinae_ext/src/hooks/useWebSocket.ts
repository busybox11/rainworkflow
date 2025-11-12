import type { AnyEvent } from "@rainworkflow/types/src/events";
import { useEffect, useMemo, useRef } from "react";
import { createWsClient } from "../lib/ws";

type MessageHandler = (data: AnyEvent) => void;

export function useWebSocket(onMessage: MessageHandler) {
  const ws = useMemo(() => createWsClient(), []);
  const onMessageRef = useRef(onMessage);

  // keep handler ref up to date
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as AnyEvent;
      onMessageRef.current(data);
    };

    return () => {
      ws.onmessage = null;
    };
  }, [ws]);

  return ws;
}
