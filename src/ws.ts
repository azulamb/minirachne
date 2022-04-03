export class WebSocketEvent {
	public onOpen(ws: WebSocket, ev: Event) {}
	public onMessage(ws: WebSocket, ev: MessageEvent) {}
	public onClose(ws: WebSocket, event: CloseEvent) {}
	public onError(ws: WebSocket, event: Event | ErrorEvent) {}
}

export function SetupWebSocket(request: Request, webSocketEvent: WebSocketEvent) {
	const { socket, response } = Deno.upgradeWebSocket(request);

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
