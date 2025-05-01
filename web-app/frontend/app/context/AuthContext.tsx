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

type UserProfileResponse = {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email?: string;
    profile?: {
        weight?: number;
        height?: number;
        profile_picture?: string;
    };
    trainer_profile?: {
        experience: string;
        pt_type: string;
        profile_picture?: string;
    };
};

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
        let newUser: User = {
            userId: tokenResponse.id,
            username: tokenResponse.username,
            profile: tokenResponse.profile || tokenResponse.trainer_profile,
            userType: tokenResponse.profile?.role || tokenResponse.trainer_profile?.role,
            firstName: tokenResponse.first_name,
            lastName: tokenResponse.last_name
        };
        // Update the user context
        setUser(newUser);

        // Persist credentials in localStorage for a smoother user experience
        localStorage.setItem("authTokens", JSON.stringify(newTokens));
        // Persist user data in localStorage
        localStorage.setItem("user", JSON.stringify(newUser));    // ← add this

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
const logout = async () => {
    await navigate("/login");
    setTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    localStorage.removeItem("user");
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
    const response = user?.userType === "user"
        ? await apiClient.get(`/user/${user?.userId}/`)
        : await apiClient.get(`/trainer/${user?.userId}/`);

    if (response.status !== 200) {
        throw new Error(`Failed to fetch user data. Status: ${response.status}`);
    }
    // Update the user data
    const userData = await response.data as UserProfileResponse;

    const newUser: User = {
        userId: userData.id,
        username: userData.username,
        profile: userData.profile || userData.trainer_profile,
        userType: user.profile?.role, // Role is only returned in the token endpoint
        firstName: userData.first_name,
        lastName: userData.last_name
    };

    console.log(newUser);

    // Update the user context
    setUser(newUser);
    // Persist updated user data in localStorage
    localStorage.setItem("user", JSON.stringify(newUser));
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