import { api } from 'boot/axios'

export const messageApi = {
  async sendMessage(messageData) {
    return await api.post('/hl-chat', messageData);
  },
  async findMessagesByRoomId(roomId) {
    let messages =  await api.get("/hl-chat/init/"+ roomId)
    let normalizedMessages = messages.data.map(message => {
      const normalizedMessage = {
        roomId: message.roomId, //  || `${Date.now()}_${Math.random()}`,
        roomName: message.messageData.roomName,
        content: message.messageData.lastUpdateMessage,
        senderId: message.messageData.lastUserId,
        senderName: messageStore.members[message.messageData.lastUserId],
        timestamp: message.messageData.lastUpdateAt,
        lastRead: message.messageData.unreadMessageCount,
        lastUpdateMessageLnNo: message.messageData.lastUpdateMessageLnNo,
        messageType: message.messageData.messageType,
      }
      if (normalizedMessage.messageType === "file") {
        normalizedMessage.fileId = message.messageData.fileId
        normalizedMessage.filePath = message.messageData.filePath
      }
      return normalizedMessage
    }).sort((a, b) => {
      const msgLnNoA = a['lastUpdateMessageLnNo']
      const msgLnNoB = b['lastUpdateMessageLnNo']
      return msgLnNoA - msgLnNoB
    })
    this.xRoomsMessages.set(props.roomId, normalizedMessages)
  },
  async findMessagesByRoomIdAndMessageLnNo(roomId, MessageLnNo) {
    let messages = await api.get("/hl-chat/"+ roomId + "/" + MessageLnNo)

    let normalizedMessages = messages.data.map(message => {
      const normalizedMessage = {
        roomId: message.roomId, //  || `${Date.now()}_${Math.random()}`,
        roomName: message.messageData.roomName,
        content: message.messageData.lastUpdateMessage,
        senderId: message.messageData.lastUserId,
        senderName: messageStore.members[message.messageData.lastUserId],
        timestamp: message.messageData.lastUpdateAt,
        lastRead: message.messageData.unreadMessageCount,
        lastUpdateMessageLnNo: message.messageData.lastUpdateMessageLnNo,
        messageType: message.messageData.messageType
      }
      if (normalizedMessage.messageType === "file") {
        normalizedMessage.fileId = message.messageData.fileId
        normalizedMessage.filePath = message.messageData.filePath
      }
      return normalizedMessage
    }).sort((a, b) => {
      const msgLnNoA = a['lastUpdateMessageLnNo']
      const msgLnNoB = b['lastUpdateMessageLnNo']
      return msgLnNoA - msgLnNoB
    })
    this.appendXRoomsMessages(roomId, normalizedMessages)
  },
  async updateLastRead(roomId, msgLnNo) {
    const request = {
      "room_id": Number(roomId),
      "message_ln_no": msgLnNo
    }
    return await api.put("/room/last-read", request)
  },
  async sendFileAndMessage(formData) {
    await api.post('/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(async (res) => {
      const requestBody = {
        room_id: res.data.room_id,
        sender_id: res.data.sender_id,
        message: res.data.file_name,
        message_type: formData.get("message_type"),
        file_id:  res.data.file_id,
        file_path:  res.data.file_path
      }
      await this.sendMessage(requestBody)
    })
  }
};
