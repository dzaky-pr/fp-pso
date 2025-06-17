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

const API_URL = process.env.AWS_API_URL || "http://localhost:3001/api";

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

export const getUserIdFromToken = (): string | null => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || null;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

export const getUserEmailFromToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const token = getAuthToken();
  if (!token) {
    return null;
  }
  try {
    // Decode payload dari token JWT
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email || null;
  } catch (error) {
    console.error("Failed to decode token for email:", error);
    return null;
  }
};
