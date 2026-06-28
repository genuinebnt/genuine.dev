"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminListNotifications,
  adminMarkAllNotificationsRead,
  adminMarkNotificationsRead,
  type AdminNotification,
} from "../../lib/admin/client";
import { connectNotificationWs } from "../../lib/admin/notificationsWs";
import { getToken } from "../../lib/auth/session";
import { formatRelativeTime } from "../../hooks/useComments";

const FALLBACK_POLL_MS = 120_000;

function kindLabel(kind: string): string {
  if (kind === "scheduled_published") return "scheduled";
  return kind.replace(/_/g, " ");
}

function NotificationPanel({
  items,
  unread,
  loading,
  onMarkAll,
  onActivate,
}: {
  items: AdminNotification[];
  unread: number;
  loading: boolean;
  onMarkAll: () => void;
  onActivate: (item: AdminNotification) => void;
}) {
  return (
    <div
      className="nav-notif-panel"
      role="dialog"
      aria-label="Notifications"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="nav-notif-head">
        <span className="nav-notif-title">Notifications</span>
        {unread > 0 && (
          <button type="button" className="nav-notif-mark-all" onClick={onMarkAll}>
            Mark all read
          </button>
        )}
      </div>
      <div className="nav-notif-list">
        {loading && items.length === 0 && (
          <div className="nav-notif-empty">Loading…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="nav-notif-empty">No notifications yet.</div>
        )}
        {items.map((item) => {
          const unreadItem = !item.read_at;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-notif-item${unreadItem ? " is-unread" : ""}`}
              onClick={() => onActivate(item)}
            >
              <div className="nav-notif-row-top">
                <span className={`nav-notif-kind${unreadItem ? " is-unread" : ""}`}>
                  {kindLabel(item.kind)}
                </span>
                <span className="nav-notif-time">{formatRelativeTime(item.created_at)}</span>
              </div>
              <div className="nav-notif-item-title">{item.title}</div>
              <div className="nav-notif-item-body">{item.body}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function dispatchUpdated() {
  window.dispatchEvent(new Event("notifications-updated"));
}

/** Admin notification bell — compact rail control with dropdown panel. */
export default function PolybarNotifications() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    try {
      const data = await adminListNotifications();
      setItems(data.items);
      setUnread(data.unread);
      dispatchUpdated();
    } catch {
      /* logged-out or backend down — keep last state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const syncAuth = () => setAuthed(!!getToken());
    syncAuth();
    window.addEventListener("auth-change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth-change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => {
    if (!authed) return;
    void refresh();
  }, [authed, refresh]);

  useEffect(() => {
    if (!authed) return;

    const disconnect = connectNotificationWs(
      (event) => {
        if (event.type === "new") {
          setItems((prev) => {
            if (prev.some((item) => item.id === event.item.id)) return prev;
            return [event.item, ...prev];
          });
          setUnread(event.unread);
        } else {
          setUnread(event.unread);
          if (event.unread === 0) {
            setItems((prev) =>
              prev.map((item) =>
                item.read_at ? item : { ...item, read_at: new Date().toISOString() },
              ),
            );
          }
        }
        dispatchUpdated();
      },
      setWsConnected,
    );

    return disconnect;
  }, [authed]);

  useEffect(() => {
    if (!authed || wsConnected) return;
    const id = window.setInterval(() => void refresh(), FALLBACK_POLL_MS);
    return () => window.clearInterval(id);
  }, [authed, wsConnected, refresh]);

  useEffect(() => {
    if (!open) return;
    void refresh();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onOutsideClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onOutsideClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onOutsideClick);
    };
  }, [open, refresh]);

  async function markOne(id: string) {
    await adminMarkNotificationsRead([id]);
    await refresh();
  }

  async function markAll() {
    await adminMarkAllNotificationsRead();
    await refresh();
  }

  function activateItem(item: AdminNotification) {
    if (!item.read_at) void markOne(item.id);
    setOpen(false);
    if (item.href) router.push(item.href);
  }

  if (!authed) return null;

  return (
    <div className="nav-tray-rail-cell nav-tray-notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`nav-tray-notif-btn${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-tray-notif-ic" aria-hidden>
          ◔
        </span>
        {unread > 0 && (
          <span className="nav-tray-notif-badge" aria-hidden>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <NotificationPanel
          items={items}
          unread={unread}
          loading={loading}
          onMarkAll={() => void markAll()}
          onActivate={activateItem}
        />
      )}
    </div>
  );
}
