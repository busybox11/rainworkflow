import { ClientType } from "@rainworkflow/types/src/clients";
import { CommonWSClient } from "./_common";

export class VencordClient extends CommonWSClient {
  constructor() {
    super(ClientType.VENCORD);
  }
}
