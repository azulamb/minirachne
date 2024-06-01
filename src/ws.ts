/**
 * Minirachne WebSocket listener.
 */
export class WebSocketListener {
  // deno-lint-ignore no-unused-vars
  public onOpen(ws: WebSocket, event: Event) {}
  // deno-lint-ignore no-unused-vars
  public onMessage(ws: WebSocket, event: MessageEvent) {}
  // deno-lint-ignore no-unused-vars
  public onClose(ws: WebSocket, event: CloseEvent) {}
  // deno-lint-ignore no-unused-vars
  public onError(ws: WebSocket, event: Event | ErrorEvent) {}
}

export function SetupWebSocket(request: Request, webSocketEvent: WebSocketListener, options?: Deno.UpgradeWebSocketOptions) {
  const { socket, response } = Deno.upgradeWebSocket(request, options);

  socket.onopen = (event) => {
    webSocketEvent.onOpen(socket, event);
  };
  socket.onmessage = (event) => {
    webSocketEvent.onMessage(socket, event);
  };
  socket.onclose = (event) => {
    webSocketEvent.onClose(socket, event);
  };
  socket.onerror = (event) => {
    webSocketEvent.onError(socket, event);
  };

  return response;
}
