/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

// mini-sass 프로젝트 공유 config
firebase.initializeApp({
  apiKey: "AIzaSyDVE9xUFOK7mi8MxZgSgZKjqttL6l3Z2e0",
  authDomain: "mini-sass.firebaseapp.com",
  projectId: "mini-sass",
  messagingSenderId: "1043765838776",
  appId: "1:1043765838776:web:devops-dashboard",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, url, type } = payload.data || {};

  const notificationTitle = title || "DevOps Dashboard";
  const notificationOptions = {
    body: body || "New notification",
    icon: icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: type || "default",
    data: { url: url || "/" },
    actions:
      type === "github_action"
        ? [
            { action: "view", title: "View Run" },
            { action: "dismiss", title: "Dismiss" },
          ]
        : [],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
