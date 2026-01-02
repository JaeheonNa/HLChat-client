import { defineStore } from 'pinia'
import { messageApi } from 'src/api/messageApi'
import { WebSocketClient } from 'src/api/websocketClient'

export const useMessageStore = defineStore('message', {
  // Vue2의 data()와 비슷
  state: () => ({
    messages: [],
    currentRoomId: null,
    wsClient: null,
    isConnected: false,
    isLoading: false
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
    async connectRoom(roomId) {
      if (this.wsClient) {
        this.disconnectRoom()
      }

      this.currentRoomId = roomId
      this.messages = []
      this.isLoading = true

      // WebSocket 연결
      this.wsClient = new WebSocketClient(roomId)

      this.wsClient.onMessage((message) => {
        console.log('New message:', message)
        this.addMessage(message)
      })

      this.wsClient.connect()
      this.isConnected = true
      this.isLoading = false
    },

    addMessage(message) {
      const normalizedMessage = {
        id: message.id || `${Date.now()}_${Math.random()}`,
        content: message.message || message.content,
        sender: message.sender_id || message.sender,
        timestamp: message.timestamp || new Date().toISOString()
      }
      this.messages.push(normalizedMessage)
      console.log('메시지 추가됨, 총:', this.messages.length)
    },

    async sendMessage(content) {

      try {
        await messageApi.sendMessage(content)
      } catch (error) {
        console.error('Send message error:', error)
        throw error
      }
    },

    disconnectRoom() {
      if (this.wsClient) {
        this.wsClient.disconnect()
        this.wsClient = null
      }
      this.isConnected = false
      this.currentRoomId = null
    }
  }
})
