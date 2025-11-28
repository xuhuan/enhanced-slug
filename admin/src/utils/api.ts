import axios, { AxiosInstance } from 'axios';
import { PLUGIN_ID } from '../pluginId';

const instance: AxiosInstance = axios.create({
    baseURL: `/${PLUGIN_ID}`,
});

instance.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');

        // 如果 token 存在，则附加到请求的 Authorization header 中
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器可以在接收到响应后，返回数据前做一些事情
instance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        // - 弹出全局的错误通知
        console.error('API Error:', error.response?.data || error.message);

        // 将错误继续抛出，以便调用方可以捕获并处理
        return Promise.reject(error.response?.data || error);
    }
);

const api = {
    /**
     * 发送 GET 请求
     * @param url - 相对于插件根路径的 URL (e.g., '/settings')
     * @param params - URL 查询参数
     * @returns
     */
    get: <T = any>(url: string, params?: object): Promise<T> => {
        return instance.get(url, { params });
    },

    /**
     * 发送 POST 请求
     * @param url - 相对于插件根路径的 URL
     * @param data - 请求体数据
     * @returns
     */
    post: <T = any>(url: string, data?: object): Promise<T> => {
        return instance.post(url, data);
    },

    /**
     * 发送 PUT 请求
     * @param url - 相对于插件根路径的 URL
     * @param data - 请求体数据
     * @returns
     */
    put: <T = any>(url: string, data?: object): Promise<T> => {
        return instance.put(url, data);
    },

    /**
     * 发送 DELETE 请求
     * @param url - 相对于插件根路径的 URL
     * @returns
     */
    del: <T = any>(url: string): Promise<T> => {
        return instance.delete(url);
    },

};

export default api;
