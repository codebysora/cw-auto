import axios from 'axios';
// Create axios instance with default config
const api = axios.create({
    baseURL: ' https://specimen-juncture-itunes.ngrok-free.dev',
    // baseURL: import.meta.env.VITE_API_URL || ' https://specimen-juncture-itunes.ngrok-free.dev',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Bypass ngrok browser warning page for GET requests in WebView/Browser
api.interceptors.request.use((config: any) => {
    try {
        const base = config.baseURL || api.defaults.baseURL || '';
        if (base.includes('ngrok-free') || base.includes('ngrok.io')) {
            config.headers = config.headers || {};
            (config.headers as any)['ngrok-skip-browser-warning'] = 'true';
        }
    } catch {}
    return config;
});

// API helper functions for making requests
export const apiClient = {
    get: async (url: string, params?: any) => {
        const response = await api.get(url, { params });
        return response.data;
    },

    post: async (url: string, data?: any) => {
        const response = await api.post(url, { ...data });
        return response.data;
    },

    patch: async (url: string, data?: any) => {
        const response = await api.patch(url, data);
        return response.data;
    },

    delete: async (url: string, params?: any) => {
        const response = await api.delete(url, { params });
        return response.data;
    }
};

export default api;
