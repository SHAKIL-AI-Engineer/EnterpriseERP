"use client";

import { useEffect, useRef, useCallback } from "react";
import { getPublicApiBaseUrl } from "@/lib/api-base";
import type { Notification } from "@/lib/services/notificationService";

interface UseNotificationStreamOptions {
  recipientId: string | null;
  onNotification: (n: Notification) => void;
  enabled?: boolean;
}

function parseSseChunk(buffer: string): { events: Notification[]; remainder: string } {
  const events: Notification[] = [];
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";
  for (const block of parts) {
    for (const line of block.split("\n")) {
      if (line.startsWith("data:")) {
        const payload = line.slice(5).trim();
        if (!payload || payload === "ping") continue;
        try {
          events.push(JSON.parse(payload) as Notification);
        } catch {
          /* ignore malformed */
        }
      }
    }
  }
  return { events, remainder };
}

/**
 * Opens an SSE connection to the Go NotificationService and delivers live
 * notifications. Uses fetch + Authorization header (EventSource cannot send
 * headers; query-string tokens often exceed URL limits).
 */
export function useNotificationStream({
  recipientId,
  onNotification,
  enabled = true,
}: UseNotificationStreamOptions) {
  const abortRef = useRef<AbortController | null>(null);
  const reconnectRef = useRef<(() => void) | null>(null);
  const onNotifRef = useRef(onNotification);

  useEffect(() => {
    onNotifRef.current = onNotification;
  }, [onNotification]);

  const connect = useCallback(async () => {
    if (!recipientId || !enabled || typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const base = getPublicApiBaseUrl().replace(/\/api\/v1\/?$/, "");
    const url = `${base}/api/v1/notification/stream/${recipientId}`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
        credentials: "include",
      });

      if (!res.ok || !res.body) {
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, remainder } = parseSseChunk(buffer);
        buffer = remainder;
        for (const n of events) {
          onNotifRef.current(n);
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      // Reconnect after drop
      setTimeout(() => reconnectRef.current?.(), 5000);
    }
  }, [recipientId, enabled]);

  useEffect(() => {
    reconnectRef.current = () => {
      void connect();
    };
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [connect]);
}
