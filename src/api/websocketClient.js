export class WebSocketClient {
  constructor(roomId, baseUrl = null) {
    this.roomId = roomId;
    // Use environment variable or fallback to localhost for development
    this.baseUrl = baseUrl || process.env.WS_BASE_URL || 'ws://localhost:8000';
    this.ws = null;
    this.messageHandlers = [];
  }

  connect() {
    // Convert relative path to absolute WebSocket URL in runtime
    let wsBaseUrl = this.baseUrl;
    if (wsBaseUrl.startsWith('/')) {
      // Relative path - convert to absolute URL at runtime
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsBaseUrl = `${protocol}//${window.location.host}${wsBaseUrl}`;
    }
    const wsUrl = `${wsBaseUrl}/hl-chat`;
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
