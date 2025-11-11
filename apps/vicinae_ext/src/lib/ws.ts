function createWsClient() {
  const ws = new WebSocket("ws://localhost:4562/ws/vicinae");
  return ws;
}

export { createWsClient };
