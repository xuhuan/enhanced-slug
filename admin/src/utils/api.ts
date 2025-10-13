import axios, { AxiosInstance } from 'axios';
import { PLUGIN_ID } from '../pluginId';

// 1. 创建一个 Axios 实例
// 这允许我们设置全局配置，如 baseURL，而不会影响 Strapi 管理后台中其他地方使用的 axios
const instance: AxiosInstance = axios.create({
    // baseURL 将所有请求都自动指向我们插件的 API 路由
    baseURL: `/${PLUGIN_ID}`,
});

// 2. 拦截器 (Interceptors) - 可选但推荐
// 请求拦截器可以在每个请求发送前做一些事情，比如添加认证头
instance.interceptors.request.use(
    async (config) => {
        // 从 localStorage 获取 Strapi 的 JWT token
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
        // 通常，我们只关心响应体中的 `data` 部分
        return response.data;
    },
    (error) => {
        // 在这里可以做统一的错误处理，比如：
        // - 如果是 401 未授权，可以触发登出逻辑
        // - 弹出全局的错误通知
        console.error('API Error:', error.response?.data || error.message);

        // 将错误继续抛出，以便调用方可以捕获并处理
        return Promise.reject(error.response?.data || error);
    }
);

// 3. 封装并导出 API 方法
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
