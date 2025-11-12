import type { ClientType } from "./clients";

import type { SearchResultItem } from "/home/rain/tests/Vencord/src/userplugins/vicinaeIPC";

export const MessageType = {
  REQUEST: "request",
  RESPONSE: "response",
} as const;

export const EventKeys = {
  SEARCH: "search",
  OPEN_DISCORD_TARGET: "open_discord_target",
} as const;
export type EventKeys = (typeof EventKeys)[keyof typeof EventKeys];

export type RequestTypeData = {
  [EventKeys.SEARCH]: {
    query: string;
  };
  [EventKeys.OPEN_DISCORD_TARGET]: {
    target: SearchResultItem;
  };
};
export type RequestTypeEventKeys = keyof RequestTypeData;

export type ResponseTypeData = {
  [EventKeys.SEARCH]: {
    query: string;
    results?: SearchResultItem[];
  };
};
export type ResponseTypeEventKeys = keyof ResponseTypeData;

export type RequestEvent<T extends RequestTypeEventKeys> = {
  $type: typeof MessageType.REQUEST;
  $event: T;
  $client: ClientType;
  $interactionId: string;
  data: RequestTypeData[T];
};
export type ResponseEvent<T extends ResponseTypeEventKeys> = {
  $type: typeof MessageType.RESPONSE;
  $event: T;
  $client: ClientType;
  $interactionId: string;
  data: ResponseTypeData[T];
};

export type AnyEvent =
  | RequestEvent<RequestTypeEventKeys>
  | ResponseEvent<ResponseTypeEventKeys>;
