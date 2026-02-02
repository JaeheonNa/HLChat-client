<template>
  <q-page class="flex column chat-page no-wrap" :style-fn="myPageStyle">
    <!-- 헤더 -->
    <div class="chat-header">
      <q-toolbar class="bg-primary text-white shadow-2">
        <q-btn flat round dense icon="arrow_back" @click="goBack" />
        <q-avatar size="40px" class="q-ml-sm">
          <q-icon name="chat" size="24px" />
        </q-avatar>
        <q-toolbar-title class="q-ml-sm">
          <div class="text-subtitle1 text-weight-bold">{{ displayRoomName }}</div>
          <div class="text-caption text-blue-2">{{ currentMessages.length }}개의 메시지</div>
        </q-toolbar-title>
        <q-btn
          flat
          round
          dense
          :icon="isConnected ? 'wifi' : 'wifi_off'"
          :color="isConnected ? 'white' : 'red-3'"
        >
          <q-tooltip>{{ isConnected ? '연결됨' : '연결 끊김' }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="more_vert">
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup>
                <q-item-section avatar><q-icon name="search" /></q-item-section>
                <q-item-section>메시지 검색</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar><q-icon name="notifications" /></q-item-section>
                <q-item-section>알림 설정</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup class="text-negative">
                <q-item-section avatar><q-icon name="exit_to_app" /></q-item-section>
                <q-item-section>채팅방 나가기</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </div>

    <!-- 메시지 리스트 -->
    <div class="scroll-area" ref="scrollAreaRef" @scroll="handleScroll">
      <!-- 이전 메시지 로딩 인디케이터 -->
      <div v-if="loadingPrevious" class="text-center q-pa-md">
        <q-spinner-dots color="primary" size="40px" />
        <div class="text-grey-6 text-caption q-mt-sm">이전 메시지 불러오는 중...</div>
      </div>

      <!-- 로딩 중 -->
      <div v-if="isLoading" class="flex flex-center column" style="height: 200px">
        <q-spinner-oval color="primary" size="50px" />
        <div class="text-grey-6 q-mt-md">대화 내용을 불러오는 중...</div>
      </div>

      <!-- 메시지 없음 -->
      <div
        v-else-if="currentMessages.length === 0"
        class="flex flex-center column q-pa-xl"
        style="height: 300px"
      >
        <q-icon name="chat_bubble_outline" size="80px" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">아직 대화가 없습니다</div>
        <div class="text-body2 text-grey-5">첫 번째 메시지를 보내 대화를 시작해보세요!</div>
      </div>

      <!-- 메시지들 (iMessage 스타일) -->
      <div v-else class="q-px-md q-py-sm">
        <template v-for="(msg, index) in currentMessages" :key="msg.lastUpdateMessageLnNo">
          <!-- 날짜 구분선 -->
          <div v-if="shouldShowDateDivider(msg, index)" class="date-divider q-my-lg">
            <span class="date-label">{{ formatDate(msg.timestamp) }}</span>
          </div>

          <!-- 내 메시지 (오른쪽) -->
          <div v-if="msg.senderId === props.userId" class="message-row my-message-row">
            <div class="message-wrapper">
              <div v-if="msg.messageType === 'img'" class="message-bubble my-bubble" :class="{ continuous: isContinuousMessage(msg, index) }">
                <q-img
                  :src="msg.content"
                  style="max-width: 200px; border-radius: 8px; cursor: pointer"
                  @click="showImagePreview(msg.content)"
                  spinner-color="white"
                />
              </div>
              <div v-else-if="msg.messageType === 'file'" class="message-bubble my-bubble" :class="{ continuous: isContinuousMessage(msg, index) }">
                <div class="flex items-center q-gutter-sm bg-grey-2 q-pa-sm rounded-borders">
                  <q-icon name="description" size="2em" color="grey-7" />
                  <div class="column">
                    <q-btn @click="downloadFile(msg)" target="_blank" class="text-weight-bold" style="text-decoration: none; color: inherit;">
                      {{ msg.content }}
                    </q-btn>
                  </div>
                </div>
              </div>
              <div v-else class="message-bubble my-bubble" :class="{ continuous: isContinuousMessage(msg, index) }">
                <span class="message-text"> {{ msg.content }} </span>
              </div>
              <div class="message-time my-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
          </div>

          <!-- 상대방 메시지 (왼쪽) -->
          <div v-else class="message-row other-message-row">
            <!-- 아바타 -->
            <div class="avatar-space">
              <q-avatar
                v-if="!isContinuousMessage(msg, index)"
                size="32px"
                color="grey-5"
                text-color="white"
                class="avatar"
              >
                {{ getInitial(msg.senderName) }}
              </q-avatar>
            </div>
            <div class="message-wrapper">
              <!-- 발신자 이름 -->
              <div v-if="!isContinuousMessage(msg, index)" class="sender-name">
                {{ msg.senderName }}
              </div>
              <div v-if="msg.messageType === 'img'" class="message-bubble other-bubble" :class="{ continuous: isContinuousMessage(msg, index) }">
                <q-img
                  :src="msg.content"
                  style="max-width: 200px; border-radius: 8px; cursor: pointer"
                  @click="showImagePreview(msg.content)"
                  spinner-color="white"
                />
              </div>
              <div v-else-if="msg.messageType === 'file'" class="message-bubble other-bubble" :class="{ continuous: isContinuousMessage(msg, index) }">
                <div class="flex items-center q-gutter-sm bg-grey-2 q-pa-sm rounded-borders">
                  <q-icon name="description" size="2em" color="grey-7" />
                  <div class="column">
                    <q-btn @click="downloadFile(msg)" target="_blank" class="text-weight-bold" style="text-decoration: none; color: inherit;">
                      {{ msg.content }}
                    </q-btn>
                  </div>
                </div>
              </div>
              <div v-else class="message-bubble other-bubble" :class="{ continuous: isContinuousMessage(msg, index) }">
                <span class="message-text">{{ msg.content }}</span>
              </div>
              <div class="message-time other-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
          </div>
        </template>

        <!-- 스크롤 앵커 -->
        <div ref="scrollAnchorRef"></div>
      </div>
    </div>

    <!-- 메시지 입력 -->
    <div class="chat-footer bg-white shadow-up-1">
      <div class="row items-center q-pa-sm q-gutter-sm">
        <input
          type="file"
          ref="fileInputRef"
          style="display: none"
          @change="handleFileSelect"
          accept="image/*, .pdf, .doc, .docx, .zip"
        />
        <q-input
          v-model="newMessage"
          outlined
          dense
          rounded
          class="col"
          placeholder="메시지를 입력하세요..."
          @keyup.enter="sendMessage"
          :disable="!isConnected"
          bg-color="grey-2"
        >
          <template v-slot:prepend>
            <q-btn
              round
              dense
              flat
              icon="attach_file"
              color="grey-7"
              @click="triggerFileSelect"
              :disable="!isConnected"
            />
          </template>
          <template v-slot:append>
            <q-btn flat round dense icon="emoji_emotions" color="grey-6">
              <q-tooltip>이모지</q-tooltip>
            </q-btn>
          </template>
        </q-input>
        <q-btn
          round
          dense
          icon="send"
          color="primary"
          @click="sendMessage"
          :disable="!newMessage.trim() || !isConnected"
        >
          <q-tooltip>전송</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useMessageStore } from 'stores/messageStore.js'
import {messageApi} from "src/api/messageApi.js"
import {fileApi} from "src/api/fileApi.js"

// Vue2: this.$router, this.$route
// Vue3: useRouter(), useRoute()
const router = useRouter()
const $q = useQuasar()
const messageStore = useMessageStore()

// props 받기 (라우터에서 props: true 설정했으므로)
const props = defineProps({
  username: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  roomId: {
    type: Number,
    required: true,
  },
})

// ref 변수들 (Vue2의 data()와 동일)
const newMessage = ref('')
const scrollAreaRef = ref(null)
const scrollAnchorRef = ref(null)
const loadingPrevious = ref(false)
const hasMoreMessages = ref(true)
const fileInputRef = ref(null)

// computed로 안전하게 가져오기
/** Computed - START **/
const currentMessages = computed(() =>
  messageStore.xRoomsMessages.get(props.roomId) || []
)
const isConnected = computed(() => messageStore.isConnected)
const isLoading = computed(() => messageStore.isLoading)
/** Computed - END **/

onBeforeMount(() => {
  if (!messageStore.xRoomsMessages.has(props.roomId)) {
    messageStore.xRoomsMessages.set(props.roomId, [])
  }
})
onMounted(async () => {
  await messageApi.findMessagesByRoomId(props.roomId)
  if (currentMessages.value.length > 0){
    const msgLnNo = currentMessages.value[currentMessages.value.length-1].lastUpdateMessageLnNo
    await messageStore.updateLastRead(props.roomId, msgLnNo)
    scrollToBottom()
  }
})
onUnmounted(() => {
})

// watch: 메시지 추가되면 스크롤 하단으로
watch(() => currentMessages.value.length, async () => {
  await nextTick()
  const container = scrollAreaRef.value;
  const threshold = 500; // 10px 여유
  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

  if (isNearBottom) {
    scrollToBottom()
  }
  if (currentMessages.value.length > 0) {
    const msgLnNo = currentMessages.value[currentMessages.value.length-1].lastUpdateMessageLnNo
    await messageStore.updateLastRead(props.roomId, msgLnNo)
  }
})

/** Methods **/
const scrollToBottom = async () => {
  await nextTick()
  if (scrollAreaRef.value) {
    scrollAreaRef.value.scrollTop = scrollAreaRef.value.scrollHeight
  }
}

// methods (Vue2의 methods와 동일, 단 그냥 함수로 선언)
const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  try {
    const requestBody = {
      room_id: props.roomId,
      sender_id: props.userId,
      message: newMessage.value,
      message_type: "str"
    }

    await messageStore.sendMessage(requestBody)
    await scrollToBottom()
    newMessage.value = ''
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '메시지 전송 실패',
      caption: error.message
    })
    console.log(error.message)
  }
}

const handleScroll = (event) => {
  const container = event.target
  // 스크롤이 최상단 근처(20px 이내)에 도달했는지 확인
  if (container.scrollTop <= 20 && !loadingPrevious.value && currentMessages.value[0].lastUpdateMessageLnNo > 1) {
    loadPreviousMessages()
  }
}

const loadPreviousMessages = async () => {
  if (loadingPrevious.value) return
  loadingPrevious.value = true
  try {
    // 이전 메시지 불러오기 API 호출
    const previousMessages = await fetchPreviousMessages(props.roomId)
    if (previousMessages && previousMessages.length > 0) {
      await nextTick()
    } else {
      hasMoreMessages.value = false
    }
  } catch (error) {
    console.error('이전 메시지 로드 실패:', error)
    $q.notify({
      type: 'negative',
      message: '이전 메시지를 불러오지 못했습니다.'
    })
  } finally {
    loadingPrevious.value = false
  }
}

const fetchPreviousMessages = async (roomId) => {
  await messageApi.findMessagesByRoomIdAndMessageLnNo(roomId, currentMessages.value[0].lastUpdateMessageLnNo)
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const triggerFileSelect = () => {
  fileInputRef.value.click()
}

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 파일 크기 체크 (예: 10MB 제한)
  if (file.size > 100 * 1024 * 1024) {
    $q.notify({ type: 'warning', message: '파일 크기는 100MB 이하여야 합니다.' })
    return
  }

  try {
    await uploadFile(file)
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: '파일 전송 실패' })
  } finally {
    // input 초기화 (같은 파일을 다시 선택할 수 있게)
    event.target.value = ''
  }
}

const uploadFile = async (file) => {
  // 보통 파일 전송은 JSON이 아니라 FormData를 사용합니다.
  const formData = new FormData()
  formData.append('file', file)
  formData.append('room_id', props.roomId)
  formData.append('sender_id', props.userId)
  const msgType = file.type.startsWith('image/') ? 'img' : 'file'
  formData.append('message_type', msgType)
  await messageApi.sendFileAndMessage(formData)
  await scrollToBottom()
}

const showImagePreview = (src) => {
  $q.dialog({
    component: {
      template: `
        <q-dialog ref="dialog" @hide="onDialogHide">
          <q-card style="max-width: 90vw;">
            <q-img :src="src" />
            <q-card-actions align="right">
              <q-btn color="primary" label="닫기" @click="onDialogOK" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      `,
      props: ['src'],
      emits: ['ok', 'hide'],
      setup() {
        return {
          show: () => {}, // Quasar dialog interface 요구사항
          hide: () => {},
          onDialogHide: () => {},
          onDialogOK: () => {}
        }
      }
    },
    componentProps: { src }
  })
}

const downloadFile = async (msg) => {
  await fileApi.downloadFile(msg.fileId)
}

// 날짜 포맷 (날짜 구분선용)
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return '오늘'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '어제'
  }
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

// 날짜 구분선 표시 여부
const shouldShowDateDivider = (msg, index) => {
  if (index === 0) return true
  const prevMsg = currentMessages.value[index - 1]
  const prevDate = new Date(prevMsg.timestamp).toDateString()
  const currDate = new Date(msg.timestamp).toDateString()
  return prevDate !== currDate
}

// 연속 메시지 여부 (같은 발신자의 연속 메시지인지)
const isContinuousMessage = (msg, index) => {
  if (index === 0) return false
  const prevMsg = currentMessages.value[index - 1]
  // 같은 발신자이고, 같은 날짜이고, 5분 이내인 경우
  const timeDiff = new Date(msg.timestamp) - new Date(prevMsg.timestamp)
  return prevMsg.senderId === msg.senderId && timeDiff < 5 * 60 * 1000
}

// 이름에서 첫 글자 추출 (아바타용)
const getInitial = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 방 이름 표시 (roomName에서 | 제거)
const displayRoomName = computed(() => {
  if (currentMessages.value.length > 0 && currentMessages.value[0].roomName) {
    return currentMessages.value[0].roomName.replace(/\|/g, ', ').replace(/^, |, $/g, '')
  }
  return `채팅방 ${props.roomId}`
})

const goBack = () => {
  router.push(`/hl-chat/${props.username}/${props.userId}`)
}

const myPageStyle = (offset) => {
  // offset: MainLayout의 헤더와 푸터 높이의 합
  // 100dvh에서 offset만큼 뺀 높이를 적용합니다.
  return { height: `calc(100dvh - ${offset}px)` }
}
</script>
<style scoped>
.chat-page {
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  background: #f2f2f7;
}

.chat-header {
  flex-shrink: 0 !important;
  width: 100%;
  z-index: 2000;
}

.scroll-area {
  flex-grow: 1 !important;
  overflow-y: auto !important;
  overflow-x: hidden;
  scrollbar-width: thin;
  height: 0;
  background: #f2f2f7;
}

.scroll-area::-webkit-scrollbar {
  width: 6px;
}

.scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.chat-footer {
  flex-shrink: 0 !important;
  width: 100%;
  z-index: 2000;
  background: #f2f2f7;
  border-top: 1px solid #c6c6c8;
}

/* 날짜 구분선 - iMessage 스타일 */
.date-divider {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px 0;
}

.date-label {
  font-size: 12px;
  font-weight: 500;
  color: #8e8e93;
  background: transparent;
}

/* 메시지 행 공통 */
.message-row {
  display: flex;
  margin-bottom: 2px;
  animation: messageAppear 0.25s ease-out;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 내 메시지 행 */
.my-message-row {
  justify-content: flex-end;
  padding-left: 60px;
}

/* 상대방 메시지 행 */
.other-message-row {
  justify-content: flex-start;
  padding-right: 60px;
}

/* 아바타 영역 */
.avatar-space {
  width: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
}

.avatar {
  font-size: 14px;
  font-weight: 600;
}

/* 메시지 래퍼 */
.message-wrapper {
  max-width: 100%;
}

/* 발신자 이름 */
.sender-name {
  font-size: 12px;
  font-weight: 500;
  color: #8e8e93;
  margin-bottom: 4px;
  margin-left: 12px;
}

/* 말풍선 공통 */
.message-bubble {
  padding: 10px 14px;
  font-size: 15px;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-word;
}

/* 내 말풍선 - iMessage 파란색 그라데이션 */
.my-bubble {
  background: linear-gradient(180deg, #0b93f6 0%, #007aff 100%);
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.my-bubble.continuous {
  border-radius: 18px 4px 4px 18px;
  margin-top: 1px;
}

/* 상대방 말풍선 - iMessage 회색 */
.other-bubble {
  background: #e5e5ea;
  color: #000000;
  border-radius: 18px 18px 18px 4px;
}

.other-bubble.continuous {
  border-radius: 4px 18px 18px 4px;
  margin-top: 1px;
}

/* 메시지 텍스트 */
.message-text {
  white-space: pre-wrap;
}

/* 시간 표시 */
.message-time {
  font-size: 11px;
  color: #8e8e93;
  margin-top: 4px;
}

.my-time {
  text-align: right;
  padding-right: 4px;
}

.other-time {
  text-align: left;
  padding-left: 12px;
}

/* 입력창 스타일 - iMessage 스타일 */
.chat-footer :deep(.q-field--outlined .q-field__control) {
  border-radius: 20px;
  background: #ffffff;
}

.chat-footer :deep(.q-field--outlined .q-field__control:before) {
  border: 1px solid #c6c6c8;
}

.chat-footer :deep(.q-field--outlined.q-field--focused .q-field__control:before) {
  border-color: #007aff;
}

/* 전송 버튼 - iMessage 스타일 */
.chat-footer .q-btn[color='primary'] {
  background: linear-gradient(180deg, #0b93f6 0%, #007aff 100%) !important;
}

.chat-footer .q-btn {
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}

.chat-footer .q-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.chat-footer .q-btn:active:not(:disabled) {
  transform: scale(0.95);
}
</style>
