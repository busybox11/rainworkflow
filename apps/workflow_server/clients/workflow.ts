import { ClientType } from "@rainworkflow/types/src/clients";
import type {
  AnyEvent,
  RequestEvent,
  RequestTypeEventKeys,
} from "@rainworkflow/types/src/events";
import { EventKeys, MessageType } from "@rainworkflow/types/src/events";
import { execSync } from "child_process";
import type { SearchResultItem } from "../../../../../tests/Vencord/src/userplugins/vicinaeIPC";
import { CommonWSClient } from "./_common";

function isRequestEvent<T extends RequestTypeEventKeys>(
  event: AnyEvent,
  eventKey: T
): event is RequestEvent<T> {
  return event.$type === MessageType.REQUEST && event.$event === eventKey;
}

export class WorkflowClient extends CommonWSClient {
  constructor() {
    super(ClientType.WORKFLOW);
  }

  override handleMessage(data: AnyEvent): void {
    console.log(
      `[WSClient/workflow] Handling message ${data.$event}/${data.$interactionId}`
    );

    if (isRequestEvent(data, EventKeys.OPEN_DISCORD_TARGET)) {
      this.handleOpenDiscordTarget(data.data.target);
    }
  }

  handleOpenDiscordTarget(target: SearchResultItem): void {
    console.log(`[WSClient/workflow] Opening Discord target`, target);

    // only focus vesktop if it is not already focused
    const activeWindow = execSync("hyprctl activewindow").toString();
    console.log(`[WSClient/workflow] Active window`, activeWindow);
    if (activeWindow.includes("class:vesktop")) {
      return;
    }

    // spawn hyprctl
    execSync("hyprctl dispatch focuswindow 'class:vesktop'");
  }
}
