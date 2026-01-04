"use client";

import { useState, useEffect } from "react";
import { X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 이미 설치된 경우 표시 안 함
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);
    if (standalone) return;

    // iOS 감지
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Android: beforeinstallprompt 이벤트 캡처
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // 2회 방문 후 표시
    const visits = parseInt(localStorage.getItem("pwa-visits") || "0") + 1;
    localStorage.setItem("pwa-visits", visits.toString());

    // 7일 내 거부한 경우 표시 안 함
    const dismissedAt = localStorage.getItem("pwa-dismissed");
    if (dismissedAt) {
      const daysSinceDismiss =
        (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) return;
    }

    if (visits >= 2) {
      setTimeout(() => setShowPrompt(true), 3000); // 3초 후 표시
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-dismissed", Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="relative mx-auto max-w-md rounded-2xl bg-card shadow-2xl border border-border p-5">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0A0A0B] flex items-center justify-center shrink-0 border border-border">
            <svg width="28" height="28" viewBox="0 0 32 32">
              <rect x="6" y="6" width="8" height="8" rx="2" fill="#10B981" />
              <rect
                x="18"
                y="6"
                width="8"
                height="8"
                rx="2"
                fill="#10B981"
                opacity="0.6"
              />
              <rect
                x="6"
                y="18"
                width="8"
                height="8"
                rx="2"
                fill="#10B981"
                opacity="0.6"
              />
              <rect
                x="18"
                y="18"
                width="8"
                height="8"
                rx="2"
                fill="#10B981"
                opacity="0.3"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">
              앱처럼 사용하세요
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              홈 화면에 추가하면 더 빠르게 접근할 수 있어요!
            </p>

            {isIOS ? (
              // iOS 수동 안내
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>
                    하단{" "}
                    <Share className="w-4 h-4 inline text-emerald-500" /> 공유
                    버튼 탭
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>
                    <Plus className="w-4 h-4 inline" /> &quot;홈 화면에
                    추가&quot; 선택
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>&quot;추가&quot; 탭</span>
                </div>
              </div>
            ) : (
              // Android 설치 버튼
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  홈 화면에 추가
                </Button>
                <Button onClick={handleDismiss} variant="ghost" size="sm">
                  나중에
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
