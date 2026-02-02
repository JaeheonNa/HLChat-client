import { api } from 'boot/axios'

export const roomApi = {
  async findRoomId(me, friend) {
    return await api.get('/room/'+ me + '/' + friend);
  },
  async createGroupRoom(members) {
    return await api.post('/room/group', { members });
  }
};
