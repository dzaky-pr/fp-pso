"use client";

import type { ILoginData, IRegisterData } from "@/types";

interface AuthSuccessResponse {
  success: true;
  data: unknown;
}

interface AuthErrorResponse {
  success: false;
  error: string;
}

type AuthResult = AuthSuccessResponse | AuthErrorResponse;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const register = async (
  userData: IRegisterData,
): Promise<AuthResult> => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to register");
    }

    return { success: true, data };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const login = async (credentials: ILoginData): Promise<AuthResult> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to login");
    }

    if (data.token) {
      localStorage.setItem("authToken", data.token);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const logout = () => {
  localStorage.removeItem("authToken");
};

export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};
