// src/utils/auth.js

export function saveToken(token) {
  if (!token) {
    console.error("❌ Tried to save empty/null token");
    return false;
  }
  try {
    localStorage.setItem("jwt", token);
    console.log("✅ JWT token saved");
    console.log("🔑 Token preview:", token.substring(0, 20) + "...");
    return true;
  } catch (error) {
    console.error("❌ Failed to save token", error);
    return false;
  }
}

export function getToken() {
  try {
    const token = localStorage.getItem("jwt");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) {
      clearToken();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem("jwt");
    console.log("✅ JWT token cleared");
    return true;
  } catch {
    return false;
  }
}

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    if (payload.exp && payload.exp < currentTime) {
      clearToken();
      return false;
    }
    return true;
  } catch {
    clearToken();
    return false;
  }
}

export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      email: payload.sub,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}

export function debugTokenStatus() {
  const token = getToken();
  if (!token) {
    console.log("❌ No JWT token found in localStorage");
    return;
  }
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("🔍 Token details:", payload);
    console.log("Email:", payload.sub);
    console.log("Expires:", new Date(payload.exp * 1000).toLocaleString());
  } catch (e) {
    console.log("❌ Failed to decode token:", e);
  }
}
