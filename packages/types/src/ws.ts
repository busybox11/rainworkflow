import type { ServerWebSocket } from "bun";
import type { ClientType } from "./clients";

export type WSData = {
  type: ClientType;
};
export type WSClient = ServerWebSocket<WSData>;
