import { defineStore } from 'pinia'
import { messageApi } from 'src/api/messageApi'
import { WebSocketClient } from 'src/api/websocketClient'
import { useReactionStore } from 'stores/reactionStore'

export const useMessageStore = defineStore('message', {
  // Vue2의 data()와 비슷
  state: () => ({
    members: {},
    allMessages: [],
    lastMessages: new Map(),
    xRoomsMessages: new Map(),
    currentRoomId: null,
    wsClient: null,
    isConnected: false,
    isLoading: false,
    rcvMessageCnt: 0
  }),

  // Vue2의 computed와 비슷
  getters: {
    sortedMessages: (state) => {
      return [...state.messages].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
      )
    }
  },

  // Vue2의 methods와 비슷
  actions: {
    async connectToServer(userList, userId) {
      for (let i = 0; i < userList.length; i ++) {
        this.members[userList[i].user_id] = {
          user_name: userList[i].user_name,
          profile_image: userList[i].profile_image
        }
      }
      if (this.wsClient) {
        this.disconnectRoom()
      }
      this.isLoading = true
      this.wsClient = new WebSocketClient()

      this.wsClient.onMessage((message) => {
        // ping 메시지 무시
        if (message.type === 'ping') {
          return
        }

        // 반응 메시지 처리
        if (message.type === 'reaction') {
          this.handleReactionMessage(message)
          return
        }

        // 일반 메시지 처리
        this.rcvMessageCnt++
        this.addMessage(message)
      })

      this.wsClient.connect(userId)
      this.isConnected = true
      this.isLoading = false
    },
    addMessage(message) {
      const member = this.members[message.messageData.lastUserId] || {}
      const normalizedMessage = {
        roomId: message.roomId, //  || `${Date.now()}_${Math.random()}`,
        roomName: message.messageData.roomName,
        content: message.messageData.lastUpdateMessage,
        senderId: message.messageData.lastUserId,
        senderName: member.user_name || message.messageData.lastUserId,
        senderProfileImage: member.profile_image,
        timestamp: message.messageData.lastUpdateAt,
        lastRead: message.messageData.unreadMessageCount,
        lastUpdateMessageLnNo: message.messageData.lastUpdateMessageLnNo,
        messageType: message.messageData.messageType
      }
      if (normalizedMessage.messageType === "file" || normalizedMessage.messageType === "img") {
        normalizedMessage.fileId = message.messageData.fileId
        normalizedMessage.filePath = message.messageData.filePath
      }

      this.lastMessages.set(Number(message.roomId), normalizedMessage)
      if (this.xRoomsMessages.has(message.roomId)) {
        let messages = this.xRoomsMessages.get(message.roomId)
        messages.push(normalizedMessage)
      }
    },

    async sendMessage(content) {
      try {
        await messageApi.sendMessage(content)
      } catch (error) {
        console.error('Send message error:', error)
        throw error
      }
    },

    async updateLastRead(roomId, msgLnNo){
      try {
        await messageApi.updateLastRead(roomId, msgLnNo)
      } catch (error) {
        console.error('updateLastRead error:', error)
        throw error
      }
    },

    disconnectRoom() {
      if (this.wsClient) {
        this.wsClient.disconnect()
        this.wsClient = null
      }
      this.isConnected = false
    },

    appendXRoomsMessages(roomId, normalizedMessages) {
      this.rcvMessageCnt += normalizedMessages.length
      let messages = this.xRoomsMessages.get(roomId)
      messages.unshift(...normalizedMessages)
    },
    clearLeavedRoomMessage(roomId) {
      this.xRoomsMessages.delete(roomId)
      this.lastMessages.delete(Number(roomId))
    },

    // WebSocket에서 받은 반응 메시지 처리
    handleReactionMessage(message) {
      // message 구조: { type: 'reaction', messageLnNo, reactions, ... }
      const reactionStore = useReactionStore()
      reactionStore.updateLocalReactions(
        Number(message.roomId),
        message.messageLnNo,
        message.reactions
      )
    }
  }
})
