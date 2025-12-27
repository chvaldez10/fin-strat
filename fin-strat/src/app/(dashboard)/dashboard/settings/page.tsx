"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      <div className="space-y-6 max-w-2xl">
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="notifications" className="text-foreground">
                Email Notifications
              </label>
              <input
                id="notifications"
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

