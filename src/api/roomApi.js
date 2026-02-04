import { api } from 'boot/axios'

export const roomApi = {
  async findRoomId(me, friend) {
    return await api.get('/room', {
      params: {  // params 객체로 감싸야 함!
        user_id: me,
        friend_id: friend
      }
    });
  },
  async findRoomInfoByRoomId(roomId){
    return await api.get(`/room/${roomId}/info`)
  },
  async createGroupRoom(members) {
    return await api.post('/room/group', { members });
  },
  async leaveXRoom(roomId) {
    return await api.post(`/room/${roomId}/leave`)
  },
  async inviteMembers(roomId, members) {
    const requestBody = {
      members: members
    }
    return await api.post(`/room/${roomId}/invitation`, requestBody)
  }
};
