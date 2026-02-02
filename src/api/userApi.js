import { api } from 'boot/axios'

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
    return await api.put('/user/temp', request)
  },
  async register(request) {
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
};
