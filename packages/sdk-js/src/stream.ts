export interface SSECallbacks {
  onPut: (data: any) => void;
  onPatch: (data: any) => void;
  onError: (error: any) => void;
}

export class SSEStream {
  private url: string;
  private sdkKey: string;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private callbacks: SSECallbacks;
  private closed = false;

  constructor(url: string, sdkKey: string, callbacks: SSECallbacks) {
    this.url = url;
    this.sdkKey = sdkKey;
    this.callbacks = callbacks;
  }

  connect(): void {
    this.closed = false;
    this.doConnect();
  }

  private doConnect(): void {
    if (this.closed) return;

    const separator = this.url.includes('?') ? '&' : '?';
    const fullUrl = `${this.url}${separator}authorization=${encodeURIComponent(this.sdkKey)}`;

    this.eventSource = new EventSource(fullUrl);

    this.eventSource.addEventListener('put', (e: MessageEvent) => {
      this.reconnectAttempts = 0;
      try {
        this.callbacks.onPut(JSON.parse(e.data));
      } catch {
        // ignore parse errors
      }
    });

    this.eventSource.addEventListener('patch', (e: MessageEvent) => {
      this.reconnectAttempts = 0;
      try {
        this.callbacks.onPatch(JSON.parse(e.data));
      } catch {
        // ignore parse errors
      }
    });

    this.eventSource.onerror = (err) => {
      this.callbacks.onError(err);
      this.eventSource?.close();
      this.eventSource = null;
      if (!this.closed) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    setTimeout(() => this.doConnect(), delay);
  }

  disconnect(): void {
    this.closed = true;
    this.eventSource?.close();
    this.eventSource = null;
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}
