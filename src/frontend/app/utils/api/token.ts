import { backendUrl } from "~/config";

const url = `${backendUrl}/auth/token/`;

// Function to fetcb access token from the backend
export const fetchToken = async (credentials: { username: string; password: string }) => {
    const username = credentials.username;
    const password = credentials.password;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) {
        // collect field errors
        const fieldErrors: string[] = [];
        for (const key in data) {
          const v = data[key];
          fieldErrors.push(
            Array.isArray(v) ? `${key}: ${v.join(" ")}` : `${key}: ${v}`
          );
        }
        alert("Login failed:\n" + fieldErrors.join("\n"));
        return;
    }

    return data;
};

// Function to refresh the access token using the refresh token
export const refreshToken = async (refreshToken: string) => {
    const response = await fetch(`${url}refresh/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            refresh: refreshToken,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    return data.access;
}
