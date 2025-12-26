"use server";

import { loginSchema } from "./schemas";

export async function login(data: { email: string; password: string }) {
  try {
    const validated = loginSchema.parse(data);
    // TODO: Implement actual authentication logic
    console.log("Login attempt:", validated.email);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Invalid credentials" };
  }
}

export async function logout() {
  // TODO: Implement logout logic
  return { success: true };
}

