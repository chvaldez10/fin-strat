"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("light");

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
            <div className="flex items-center justify-between">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="px-3 py-2 border border-border rounded-md"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

