import type { ClientType } from "@rainworkflow/types/src/clients";
import { type AnyEvent } from "@rainworkflow/types/src/events";

export abstract class CommonWSClient {
  clientName: ClientType;

  constructor(clientName: ClientType) {
    this.clientName = clientName;
    console.log(`[WSClient/${this.clientName}] Registered`);
  }

  handleMessage(data: AnyEvent): AnyEvent | void {
    console.log(
      `[WSClient/${this.clientName}] Handling message ${data.$event}/${data.$interactionId}`
    );

    return data;
  }
}
