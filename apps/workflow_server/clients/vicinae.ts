import { ClientType } from "@rainworkflow/types/src/clients";
import { CommonWSClient } from "./_common";

export class VicinaeClient extends CommonWSClient {
  constructor() {
    super(ClientType.VICINAE);
  }
}
