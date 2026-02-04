import {api} from 'boot/axios'
import CryptoJS from 'crypto-js';

export const userApi = {
  async findUserList() {
    return await api.get('/user');
  },
  async findUserListByRoomId(roomId) {
    return await api.get('/user/' + roomId)
  },
  async saveTempUser(request) {
    return await api.post('/user/temp', request)
  },
  async changePassword(request) {
    request.password = CryptoJS.SHA256(request.user_id + request.new_password).toString()
    return await api.put('/user/temp', request)
  },
  async register(request) {
    request.password = CryptoJS.SHA256(request.user_id + request.password).toString()
    return await api.post('/user/register', request)
  },
  async getMyProfile() {
    return await api.get('/user/me')
  },
  async updateMyProfile(request) {
    return await api.put('/user/me', request)
  },
  async uploadProfileImage(formData) {
    return await api.post('/user/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  async verifyToken() {
    return await api.get('/user/verify-token')
  },
  async getKakaoAuthUrl() {
    return await api.get('/user/kakao/login')
  },
  async kakaoCallback(code, autoRegister = true) {
    return await api.get('/user/kakao/callback', { params: { code, auto_register: autoRegister } })
  },
  async kakaoRegister(request) {
    return await api.post('/user/kakao/register', request)
  },
  async kakaoCheckExisting(request) {
    return await api.post('/user/kakao/check-existing', request)
  },
  async kakaoLink(request) {
    return await api.post('/user/kakao/link', request)
  },
};
