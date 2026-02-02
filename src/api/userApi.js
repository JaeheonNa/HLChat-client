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
};
