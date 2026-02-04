import {defineBoot} from '#q-app/wrappers'
import axios from 'axios'
import CryptoJS from 'crypto-js';

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: process.env.API_BASE_URL || 'http://localhost:8000' })

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 로그인 요청은 401 처리에서 제외
    const isLoginRequest = error.config?.url?.includes('/log-in')
    if (error.response?.status === 401 && !isLoginRequest) {
      // 토큰 만료 시 처리
      sessionStorage.clear()
      window.location.href = '/hl-chat/log-in'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  async login(credentials) {
    credentials.password = CryptoJS.SHA256(credentials.user_id + credentials.password).toString()
    return await api.post('/user/log-in', credentials)
  },

  async logout() {
    sessionStorage.clear()
  }
}

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

export { api }
