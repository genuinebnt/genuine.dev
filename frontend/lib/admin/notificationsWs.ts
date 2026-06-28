import { API } from "../api";
import { getToken } from "../auth/session";
import type { AdminNotification } from "./types";

export type NotificationWsEvent =
  | { type: "new"; item: AdminNotification; unread: number }
  | { type: "refresh"; unread: number };

function wsUrl(token: string): string {
  const base = API.replace(/^http/, "ws");
  return `${base}/api/admin/notifications/ws?token=${encodeURIComponent(token)}`;
}

const MIN_RECONNECT_MS = 1_000;
const MAX_RECONNECT_MS = 30_000;

/** Keeps an admin notification WebSocket open with backoff reconnect. */
export function connectNotificationWs(
  onEvent: (event: NotificationWsEvent) => void,
  onConnectionChange?: (connected: boolean) => void,
): () => void {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = MIN_RECONNECT_MS;
  let closed = false;

  function clearReconnect() {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function scheduleReconnect() {
    if (closed) return;
    clearReconnect();
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_MS);
  }

  function connect() {
    const token = getToken();
    if (!token || closed) return;

    ws = new WebSocket(wsUrl(token));

    ws.onopen = () => {
      reconnectDelay = MIN_RECONNECT_MS;
      onConnectionChange?.(true);
    };

    ws.onmessage = (msg) => {
      try {
        const event = JSON.parse(String(msg.data)) as NotificationWsEvent;
        if (event.type === "new" || event.type === "refresh") {
          onEvent(event);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onclose = () => {
      ws = null;
      onConnectionChange?.(false);
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  connect();

  return () => {
    closed = true;
    clearReconnect();
    ws?.close();
    ws = null;
    onConnectionChange?.(false);
  };
}
