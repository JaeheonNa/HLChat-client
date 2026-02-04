import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reactionApi } from 'src/api/reactionApi'

export const useReactionStore = defineStore('reaction', () => {
  // Map<roomId, Map<messageLnNo, { [reactionType]: { count, users: [{userId, userName}] } }>>
  const reactions = ref(new Map())

  /**
   * 반응 토글 (추가/제거) - API 호출
   * @param {number} roomId - 채팅방 ID
   * @param {number} messageLnNo - 메시지 라인 번호
   * @param {string} reactionType - 반응 타입 (thumbsup, heart 등)
   * @param {string} userId - 사용자 ID
   * @param {string} userName - 사용자 이름
   * @returns {Promise<{ action: 'added' | 'removed', reactions: object }>}
   */
  const toggleReaction = async (roomId, messageLnNo, reactionType, userId, userName) => {
    const numRoomId = Number(roomId)
    const numMessageLnNo = Number(messageLnNo)
    try {
      const result = await reactionApi.toggleReaction(numRoomId, numMessageLnNo, userId, userName, reactionType)

      // 로컬 상태 업데이트
      updateLocalReactions(numRoomId, numMessageLnNo, result.reactions)

      return result
    } catch (error) {
      console.error('반응 토글 실패:', error)
      throw error
    }
  }

  /**
   * 로컬 반응 상태 업데이트
   */
  const updateLocalReactions = (roomId, messageLnNo, newReactions) => {
    const numRoomId = Number(roomId)
    const numMessageLnNo = Number(messageLnNo)

    if (!reactions.value.has(numRoomId)) {
      reactions.value.set(numRoomId, new Map())
    }
    const roomReactions = reactions.value.get(numRoomId)

    if (!newReactions || Object.keys(newReactions).length === 0) {
      roomReactions.delete(numMessageLnNo)
    } else {
      roomReactions.set(numMessageLnNo, newReactions)
    }
  }

  /**
   * WebSocket에서 받은 반응 메시지 처리
   */
  const handleReactionMessage = (message) => {
    const { roomId, messageLnNo, reactions: newReactions } = message
    updateLocalReactions(roomId, messageLnNo, newReactions)
  }

  /**
   * 채팅방 입장 시 반응 데이터 로드
   * @param {number} roomId - 채팅방 ID
   */
  const loadRoomReactions = async (roomId) => {
    const numRoomId = Number(roomId)
    try {
      console.log('[reactionStore] loadRoomReactions 시작: roomId=', numRoomId)
      const roomReactionsData = await reactionApi.getRoomReactions(numRoomId)
      console.log('[reactionStore] API 응답:', roomReactionsData)

      if (!reactions.value.has(numRoomId)) {
        reactions.value.set(numRoomId, new Map())
      }
      const roomReactions = reactions.value.get(numRoomId)

      // API 응답을 Map에 저장
      if (roomReactionsData && typeof roomReactionsData === 'object') {
        for (const [messageLnNo, messageReactions] of Object.entries(roomReactionsData)) {
          console.log('[reactionStore] 반응 저장: messageLnNo=', messageLnNo, messageReactions)
          roomReactions.set(Number(messageLnNo), messageReactions)
        }
      }
      console.log('[reactionStore] 로드 완료. 총 반응 수:', roomReactions.size)
    } catch (error) {
      console.error('[reactionStore] 반응 데이터 로드 실패:', error)
    }
  }

  /**
   * 특정 메시지의 반응 조회
   * @param {number} roomId - 채팅방 ID
   * @param {number} messageLnNo - 메시지 라인 번호
   * @returns {object} 반응 객체 { [reactionType]: { count, users } }
   */
  const getMessageReactions = (roomId, messageLnNo) => {
    const roomReactions = reactions.value.get(Number(roomId))
    if (!roomReactions) return {}
    return roomReactions.get(Number(messageLnNo)) || {}
  }

  /**
   * 사용자가 특정 반응을 했는지 확인
   * @param {number} roomId - 채팅방 ID
   * @param {number} messageLnNo - 메시지 라인 번호
   * @param {string} reactionType - 반응 타입
   * @param {string} userId - 사용자 ID
   * @returns {boolean}
   */
  const hasUserReacted = (roomId, messageLnNo, reactionType, userId) => {
    const messageReactions = getMessageReactions(Number(roomId), Number(messageLnNo))
    if (!messageReactions[reactionType]) return false
    return messageReactions[reactionType].users.some(u => u.userId === userId)
  }

  /**
   * 메시지에 반응이 있는지 확인
   * @param {number} roomId - 채팅방 ID
   * @param {number} messageLnNo - 메시지 라인 번호
   * @returns {boolean}
   */
  const hasReactions = (roomId, messageLnNo) => {
    const messageReactions = getMessageReactions(Number(roomId), Number(messageLnNo))
    return Object.keys(messageReactions).length > 0
  }

  /**
   * 채팅방 나갈 때 반응 데이터 정리
   * @param {number} roomId - 채팅방 ID
   */
  const clearRoomReactions = (roomId) => {
    reactions.value.delete(Number(roomId))
  }

  return {
    reactions,
    toggleReaction,
    updateLocalReactions,
    handleReactionMessage,
    loadRoomReactions,
    getMessageReactions,
    hasUserReacted,
    hasReactions,
    clearRoomReactions
  }
})
