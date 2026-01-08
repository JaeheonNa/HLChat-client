export class WebSocketClient {
  constructor(roomId, baseUrl = 'ws://localhost:8000') {
    this.roomId = roomId;
    this.baseUrl = baseUrl;
    this.ws = null;
    this.messageHandlers = [];
  }

  connect() {
    const wsUrl = `${this.baseUrl}/hl-chat/${this.roomId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: sessionStorage.getItem("access_token")
      }));
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messageHandlers.forEach(handler => handler(message));
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
    };
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  disconnect() {
    this.ws?.close();
  }
}
