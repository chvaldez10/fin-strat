"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      <div className="space-y-6 max-w-2xl">
        <div className="border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="notifications">Email Notifications</label>
              <input
                id="notifications"
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

