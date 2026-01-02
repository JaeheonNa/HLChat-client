import { api } from 'boot/axios'

export const messageApi = {
  async sendMessage(messageData) {
    return await api.post('/hl-chat', messageData);
  }
};
