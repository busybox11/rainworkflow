import { ClientType } from "@rainworkflow/types/src/clients";
import {
  EventKeys,
  MessageType,
  RequestEvent,
  RequestTypeEventKeys,
  SearchResultItem,
} from "@rainworkflow/types/src/events";

export function createSearchEvent(
  query: string
): RequestEvent<typeof EventKeys.SEARCH> {
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

export function createOpenTargetEvent(
  target: SearchResultItem
): RequestEvent<typeof EventKeys.OPEN_DISCORD_TARGET> {
  return {
    $type: MessageType.REQUEST,
    $interactionId: `vencord_focus_${Date.now()}`,
    $client: ClientType.VICINAE,
    $event: EventKeys.OPEN_DISCORD_TARGET,
    data: {
      target,
    },
  };
}

export function sendEvent(
  ws: WebSocket,
  event: RequestEvent<RequestTypeEventKeys>
): void {
  ws.send(JSON.stringify(event));
}
