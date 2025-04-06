// Read environment variables

// Check if we are running server-side or client-side
const isServer = typeof window === 'undefined'; // Check if we are in a server environment

// Check if we are running in production mode
const isProduction = isServer
    ? process.env.NODE_ENV === 'production' // Check the NODE_ENV variable for production mode
    : import.meta.env.MODE === 'production'; // Check the Vite environment variable for production mode

console.log("Is production mode:", isProduction); // Log the production mode for debugging

export let backendUrl: string; // Declare backendUrl variable

if (isProduction) {
    // If we are, get the API and WS URLs from the environment variables
    backendUrl = isServer
        ? process.env.BACKEND_API_URL || 'https://localhost/api' // Use the API URL from the server environment variables
        : import.meta.env.VITE_BACKEND_API_URL || 'https://localhost/api'; // Use the API URL from the Vite environment variables
} else {
    // If we are not in production, use the Vite environment variable for testing or default localhost URL
    backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'; 
}

export let wsUrl: string; // Declare wsUrl variable

if (isProduction) {
    // If we are in production, get the WS URL from the environment variables
    wsUrl = isServer
        ? process.env.WS_URL || 'wss://localhost/ws' // Use the WS URL from the server environment variables
        : import.meta.env.VITE_WS_URL || 'wss://localhost/ws'; // Use the WS URL from the Vite environment variables
} else {
    // If we are not in production, use the Vite environment variable for testing or default localhost URL
    wsUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://127.0.0.1:8000'
}

console.log("Backend URL:", backendUrl); // Log the backend URL for debugging
console.log("WebSocket URL:", wsUrl); // Log the WebSocket URL for debugging