import axios from 'axios';
import { getValidAccessToken } from '../authService';
import { backendUrl, wsUrl } from '~/config';

declare module 'axios' {
    export interface AxiosInstance {
        createSocket(chatRoomId: number): Promise<WebSocket>;
    }
}

const apiClient = axios.create({
    baseURL: backendUrl,
});

// Before each request, check if the access token is valid and set it in the headers
apiClient.interceptors.request.use( async (config) => {
    const token = await getValidAccessToken();

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

apiClient.createSocket = async function createAuthSocket(chatRoomId: number) {
    const token = await getValidAccessToken();
    const socket = new WebSocket(`${wsUrl}/chat/${chatRoomId}/?token=${token}`);

    return socket;
}

export default apiClient;