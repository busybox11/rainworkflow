import { ClientType } from "@rainworkflow/types/src/clients";
import type { WSClient, WSData } from "@rainworkflow/types/src/ws";
import type { CommonWSClient } from "./clients/_common";
import { VencordClient } from "./clients/vencord";
import { VicinaeClient } from "./clients/vicinae";
import { WorkflowClient } from "./clients/workflow";

const wsListeners = new Map<ClientType, Map<WSClient, CommonWSClient>>();
Object.values(ClientType).forEach((clientType) => {
  wsListeners.set(clientType, new Map<WSClient, CommonWSClient>());
});

const InternalClients = {
  [ClientType.VENCORD]: VencordClient,
  [ClientType.VICINAE]: VicinaeClient,
  [ClientType.WORKFLOW]: WorkflowClient,
} as const;
const createClient = (clientType: ClientType): CommonWSClient => {
  return new InternalClients[clientType]();
};

function registerClient(ws: WSClient) {
  const clientType = ws.data.type as ClientType;
  console.log(`[WS] Registering ${clientType}`);

  wsListeners.get(clientType)?.set(ws, createClient(clientType));

  console.log(`[WS] Registered ${clientType}`);
}

function unregisterClient(ws: WSClient) {
  const clientType = ws.data.type as ClientType;
  console.log(`[WS] Unregistering ${clientType}`);

  const client = wsListeners.get(clientType)?.get(ws);
  if (client) {
    wsListeners.get(clientType)?.delete(ws);
  }

  console.log(`[WS] Unregistered ${clientType}`);
  console.log(`[WS] Remaining clients: ${wsListeners.get(clientType)?.size}`);
}

Bun.serve({
  port: 4562,
  websocket: {
    data: {} as WSData,
    open(ws) {
      registerClient(ws);
    },
    message(ws, message) {
      const data = JSON.parse(message as string);
      console.log(`[WS/${ws.data.type}] Message`, data);

      for (const [clientType, clients] of wsListeners.entries()) {
        if (clientType !== ws.data.type) {
          clients.entries().forEach(([clientWs, clientInstance]) => {
            clientInstance.handleMessage(data);
            clientWs.send(JSON.stringify(data));
          });
        }
      }
    },
    close(ws) {
      unregisterClient(ws);
    },
  },

  fetch(req, server) {
    console.log(`${req.url} requested`);
    const reqUrl = new URL(req.url);
    const clientType = reqUrl.pathname.split("/")[2] as ClientType;

    if (reqUrl.pathname.includes("/ws/") && wsListeners.get(clientType)) {
      console.log(`[HTTP] Upgrading to WebSocket for ${clientType}`);
      server.upgrade(req, {
        data: {
          type: clientType,
        },
      });

      return new Response("Upgraded to WebSocket");
    }

    return new Response("Not found");
  },
});

console.log("Server is running on port 4562");
const workflowWsClient = new WebSocket("ws://localhost:4562/ws/workflow");
workflowWsClient.onmessage = (event) => {
  const data = JSON.parse(event.data as string);
};
