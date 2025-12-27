import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-2">Total Revenue</h2>
          <p className="text-3xl font-bold">$0.00</p>
        </div>
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-2">Active Users</h2>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-2">Transactions</h2>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}

