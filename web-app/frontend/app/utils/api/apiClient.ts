import axios from 'axios';
import { getValidAccessToken } from '../authService';
import { backendUrl } from '~/config';

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

export default apiClient;