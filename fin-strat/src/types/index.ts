export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AnalyticsData {
  revenue: number;
  users: number;
  transactions: number;
  chartData: ChartDataPoint[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

