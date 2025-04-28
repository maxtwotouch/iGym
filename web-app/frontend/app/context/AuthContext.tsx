// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { fetchToken } from "~/utils/api/token"; // Assume these functions exist and return a Promise
import { getValidAccessToken } from "~/utils/authService"; // Assume this function exists and returns a valid access token or null
import apiClient from "~/utils/api/apiClient";

// Define the types for tokens and user info
interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;  // How long the access token is valid (in ms)
    refreshTokenExpiry: number; // How long the refresh token is valid (in ms)
    accessTokenRefreshed: number; // Timestamp when the access token was last refreshed
    refreshTokenRefreshed: number; // Timestamp when the refresh token was last refreshed
}
interface User {
    userId: number;
    username: string;
    profile: any;
    userType: string;
    firstName: string;
    lastName: string;
}

interface AuthContextType {
    tokens: AuthTokens | null;
    user: User | null;
    loading: boolean;
    // Log in using credentials; fetchToken() will return tokens and user data
    login: (credentials: { username: string; password: string }) => Promise<boolean>;
    logout: () => void;
    // Returns a valid access token (or tries to refresh it) or logs out if not possible.
    getToken: () => Promise<string | null>;
    // Update the user context with new data
    updateUserContext: () => Promise<void>;
}

// Create the authentication context (undefined until provided)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [tokens, setTokens] = useState<AuthTokens | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // On client load, attempt to rehydrate authentication state from localStorage.
    useEffect(() => {
        if (typeof window !== "undefined") {
        const storedTokens = localStorage.getItem("authTokens");
        const storedUser = localStorage.getItem("user");
        if (storedTokens && storedUser) {
            try {
            const parsedTokens: AuthTokens = JSON.parse(storedTokens);
            const parsedUser: User = JSON.parse(storedUser);
            setTokens(parsedTokens);
            setUser(parsedUser);
            // If a valid token exists and the user is accessing the login page, redirect to dashboard.
            if (window.location.pathname === "/login" && parsedTokens.accessTokenExpiry > Date.now()) {
                navigate("/dashboard");
            }
            } catch (error) {
            console.error("Failed to parse stored auth data:", error);
            }
        }
        }
        setLoading(false);
}, [navigate]);

// login() uses fetchToken to obtain tokens and user data, and persists them.
const login = async (credentials: { username: string; password: string }) => {
    setLoading(true);
    try {
        const tokenResponse = await fetchToken(credentials);

        // Get the current time
        const now = Date.now();

        const newTokens: AuthTokens = {
            accessToken: tokenResponse.access,
            refreshToken: tokenResponse.refresh,
            accessTokenExpiry: Number(tokenResponse.accessExp) * 1000, // How long the access token is valid (provided in seconds, convert to ms)
            refreshTokenExpiry: Number(tokenResponse.refreshExp) * 1000, // How long the refresh token is valid (provided in seconds, convert to ms)
            accessTokenRefreshed: now, // Fetched a new token, so set the refreshed time to now
            refreshTokenRefreshed: now, // Fetched a new token, so set the refreshed time to now
        };
        setTokens(newTokens);
        const user: User = {
            userId: tokenResponse.id,
            username: tokenResponse.username,
            profile: tokenResponse.profile,
            userType: tokenResponse.profile?.role,
            firstName: tokenResponse.first_name,
            lastName: tokenResponse.last_name
        };
        // Update the user context
        setUser(user);
        // Persist credentials in localStorage for a smoother user experience
        localStorage.setItem("authTokens", JSON.stringify(newTokens));
        return true;
    } catch (error) {
        console.error("Login failed:", error);
        return false;
    // Optionally, set an error state or message for the login component
    } finally {
        setLoading(false);
    }
};

  // logout() clears the authentication state and navigates to the login screen.
const logout = () => {
    setTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    navigate("/login");
};

  // getToken() handles token retrieval & refresh logic.
const getToken = async () => {
    const token = await getValidAccessToken();
    if (!token) {
        logout();  // redirect to login
        return null;
    }
    return token;
};

const updateUserContext = async () => {
    // Check if user is logged in
    if (!user) {
        throw new Error("User is not logged in");
    }
    // Check if userId is defined
    if (!user.userId) {
        throw new Error("User ID is undefined");
    }

    // Fetch new user data from the API
    const response = await apiClient.get(`/user/${user?.userId}/`);
    // Check if the response is successful
    if (response.status !== 200) {
        throw new Error(`Failed to fetch user data. Status: ${response.status}`);
    }
    // Update the user data
    const userData = await response.data;

    const newUser: User = {
        userId: userData.id,
        username: userData.username,
        profile: userData.profile,
        userType: userData.profile?.role,
        firstName: userData.first_name,
        lastName: userData.last_name
    };

    // Update the user context
    setUser(newUser);
}

const contextValue: AuthContextType = {
    tokens,
    user,
    loading,
    login,
    logout,
    getToken,
    updateUserContext,
};

return (
    <AuthContext.Provider value={contextValue}>
        {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
)};

// Custom hook for easier access to the authentication context.
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};