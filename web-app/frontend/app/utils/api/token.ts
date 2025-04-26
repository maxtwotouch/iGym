import { backendUrl } from "~/config";

const url = `${backendUrl}/token/`;

// Function to fetcb access token from the backend
export const fetchToken = async (credentials: { username: string; password: string }) => {
    const username = credentials.username;
    const password = credentials.password;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch token");
    }
    const data = await response.json();
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
