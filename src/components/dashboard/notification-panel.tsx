"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Bell,
  BellOff,
  GitBranch,
  Send,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFCM } from "@/hooks/use-fcm";

interface NotificationItem {
  id: string;
  type: "push" | "github_action";
  title?: string;
  body?: string;
  repo?: string;
  workflow?: string;
  status?: string;
  url?: string;
  triggered_at?: string;
  sent_at?: string;
}

export function NotificationPanel() {
  const { permission, loading, requestPermission, isEnabled } = useFCM();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [fetching, setFetching] = useState(false);

  const fetchNotifications = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/notifications?limit=20");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // 30초마다 새로고침
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: ko,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Bell className="w-4 h-4" />
          알림 / Actions 이력
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchNotifications}
            disabled={fetching}
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
          </Button>
          {!isEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestPermission}
              disabled={loading}
            >
              {permission === "denied" ? (
                <BellOff className="w-4 h-4 mr-1" />
              ) : (
                <Bell className="w-4 h-4 mr-1" />
              )}
              {loading ? "설정 중..." : "알림 켜기"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">아직 알림이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="shrink-0 mt-0.5">
                    {item.type === "github_action" ? (
                      <GitBranch className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Send className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {item.type === "github_action"
                          ? item.repo?.split("/")[1] || item.repo
                          : item.title}
                      </span>
                      <Badge
                        variant={
                          item.type === "github_action" ? "outline" : "secondary"
                        }
                        className="shrink-0 text-xs"
                      >
                        {item.type === "github_action" ? "Action" : "Push"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {item.type === "github_action"
                        ? `${item.workflow} → ${item.status}`
                        : item.body}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(item.triggered_at || item.sent_at)}
                      </span>
                      {item.type === "github_action" && item.repo && (
                        <a
                          href={`https://github.com/${item.repo}/actions`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-500 hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
