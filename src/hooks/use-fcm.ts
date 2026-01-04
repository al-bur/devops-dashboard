"use client";

import { useState, useEffect, useCallback } from "react";
import { getFCMToken, onForegroundMessage } from "@/lib/firebase";
import { toast } from "sonner";

export function useFCM() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined") return;

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // Service Worker 등록
        if ("serviceWorker" in navigator) {
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        }

        const fcmToken = await getFCMToken();
        if (fcmToken) {
          setToken(fcmToken);

          // 서버에 토큰 등록
          await fetch("/api/fcm/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: fcmToken }),
          });

          toast.success("푸시 알림이 활성화되었습니다");
        }
      } else {
        toast.error("푸시 알림 권한이 거부되었습니다");
      }
    } catch (error) {
      console.error("FCM permission error:", error);
      toast.error("푸시 알림 설정 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  // 포그라운드 메시지 수신
  useEffect(() => {
    if (permission !== "granted") return;

    const unsubscribe = onForegroundMessage((payload) => {
      const data = payload as { data?: { title?: string; body?: string } };
      toast.info(data.data?.title || "New notification", {
        description: data.data?.body,
      });
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [permission]);

  return {
    token,
    permission,
    loading,
    requestPermission,
    isEnabled: permission === "granted",
  };
}
