import { api } from 'boot/axios'

export const reactionApi = {
  async toggleReaction(roomId, messageLnNo, userId, userName, reactionType) {
    const request = {
      room_id: Number(roomId),
      message_ln_no: Number(messageLnNo),
      user_id: userId,
      user_name: userName,
      reaction_type: reactionType
    }
    console.log('[reactionApi] toggleReaction 요청:', request)
    const response = await api.post('/hl-chat/reaction', request)
    console.log('[reactionApi] toggleReaction 응답:', response.data)
    return response.data
  },

  async getMessageReactions(roomId, messageLnNo) {
    const response = await api.get(`/hl-chat/reaction/${Number(roomId)}/${Number(messageLnNo)}`)
    return response.data
  },

  async getRoomReactions(roomId) {
    console.log('[reactionApi] getRoomReactions 요청: roomId=', roomId)
    const response = await api.get(`/hl-chat/reaction/${Number(roomId)}`)
    console.log('[reactionApi] getRoomReactions 응답:', response.data)
    return response.data
  }
}
