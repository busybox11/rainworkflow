export const ClientType = {
  VENCORD: "vencord",
  VICINAE: "vicinae",
  WORKFLOW: "workflow",
} as const;
export type ClientType = (typeof ClientType)[keyof typeof ClientType];
