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
        <q-btn flat round dense :icon="isConnected ? 'wifi' : 'wifi_off'" :color="isConnected ? 'white' : 'red-3'">
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
              <q-item clickable v-close-popup @click="showTeamChatDialog = true">
                <q-item-section avatar><q-icon name="invitation" /></q-item-section>
                <q-item-section>초대하기</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="handleLeaveRoom" class="text-negative">
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

          <div v-if="msg.messageType === 'system'" class="date-divider q-my-lg">
            <span class="date-label">{{ msg.content }}</span>
          </div>

          <!-- 내 메시지 (오른쪽) -->
          <div v-else-if="msg.senderId === props.userId" class="message-row my-message-row">
            <div class="message-wrapper my-message-wrapper">
              <div class="message-content-row" v-touch-hold.mouse="() => handleLongPress(msg)">
                <!-- 반응 추가 버튼 -->
                <q-btn
                  class="reaction-add-btn"
                  round
                  flat
                  dense
                  size="sm"
                  icon="add_reaction"
                  color="grey-6"
                >
                  <ReactionPicker @select="handleReactionSelect(msg, $event)" />
                </q-btn>

                <div v-if="msg.messageType === 'img'" class="message-bubble other-bubble" :class="{ continuous: isContinuousMessage(msg, index) }">
                  <div class="cursor-pointer" @click="viewImage(msg)">
                    <q-img :src="`${api.defaults.baseURL}/file/info/${msg.fileId}/${props.userId}`" :ratio="16/9" style="max-width: 300px; border-radius: 8px;" spinner-color="primary" spinner-size="2em">
                      <template v-slot:error>
                        <div class="absolute-full flex flex-center bg-grey-3">
                          <q-icon name="broken_image" size="2em" color="grey-6" />
                        </div>
                      </template>
                    </q-img>
                    <div class="text-caption text-grey-7 q-mt-xs">
                      {{ msg.content }}
                    </div>
                  </div>
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
                <div v-else-if="msg.messageType === 'emoticon'" class="emoticon-message">
                  <q-img
                    :src="`/emoticon/common/${msg.content}`"
                    width="80px"
                    height="80px"
                    fit="contain"
                  />
                </div>
                <div v-else class="message-bubble my-bubble" :class="{ continuous: isContinuousMessage(msg, index) }">
                  <span class="message-text"> {{ msg.content }} </span>
                </div>
              </div>

              <!-- 반응 표시 영역 -->
              <MessageReactions
                v-if="hasReactions(msg.lastUpdateMessageLnNo)"
                :reactions="getMessageReactions(msg.lastUpdateMessageLnNo)"
                :current-user-id="props.userId"
                :message-ln-no="msg.lastUpdateMessageLnNo"
                @toggle="handleReactionToggle"
                class="my-reactions"
              />

              <div class="message-time my-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
          </div>

          <!-- 상대방 메시지 (왼쪽) -->
          <div v-else class="message-row other-message-row">
            <!-- 아바타 -->
            <div class="avatar-space">
              <q-avatar v-if="!isContinuousMessage(msg, index)" size="32px" color="grey-5" text-color="white" class="avatar">
                <img v-if="msg.senderProfileImage" :src="getProfileImageUrl(msg.senderProfileImage)" />
                <span v-else>{{ getInitial(msg.senderName) }}</span>
              </q-avatar>
            </div>
            <div class="message-wrapper other-message-wrapper">
              <!-- 발신자 이름 -->
              <div v-if="!isContinuousMessage(msg, index)" class="sender-name">
                {{ msg.senderName }}
              </div>

              <div class="message-content-row" v-touch-hold.mouse="() => handleLongPress(msg)">
                <div v-if="msg.messageType === 'img'" class="message-bubble other-bubble" :class="{ continuous: isContinuousMessage(msg, index) }">
                  <div class="cursor-pointer" @click="viewImage(msg)">
                    <q-img :src="`${api.defaults.baseURL}/file/info/${msg.fileId}/${props.userId}`" :ratio="16/9" style="max-width: 300px; border-radius: 8px;" spinner-color="primary" spinner-size="2em">
                      <template v-slot:error>
                        <div class="absolute-full flex flex-center bg-grey-3">
                          <q-icon name="broken_image" size="2em" color="grey-6" />
                        </div>
                      </template>
                    </q-img>
                    <div class="text-caption text-grey-7 q-mt-xs">
                      {{ msg.content }}
                    </div>
                  </div>
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
                <div v-else-if="msg.messageType === 'emoticon'" class="emoticon-message">
                  <q-img
                    :src="`/emoticon/common/${msg.content}`"
                    width="80px"
                    height="80px"
                    fit="contain"
                  />
                </div>
                <div v-else class="message-bubble other-bubble" :class="{ continuous: isContinuousMessage(msg, index) }">
                  <span class="message-text">{{ msg.content }}</span>
                </div>

                <!-- 반응 추가 버튼 -->
                <q-btn
                  class="reaction-add-btn"
                  round
                  flat
                  dense
                  size="sm"
                  icon="add_reaction"
                  color="grey-6"
                >
                  <ReactionPicker @select="handleReactionSelect(msg, $event)" />
                </q-btn>
              </div>

              <!-- 반응 표시 영역 -->
              <MessageReactions
                v-if="hasReactions(msg.lastUpdateMessageLnNo)"
                :reactions="getMessageReactions(msg.lastUpdateMessageLnNo)"
                :current-user-id="props.userId"
                :message-ln-no="msg.lastUpdateMessageLnNo"
                @toggle="handleReactionToggle"
                class="other-reactions"
              />

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
      <div class="chat-input-container row items-center q-pa-sm q-gutter-sm">
        <input type="file" ref="fileInputRef" style="display: none" @change="handleFileSelect" accept="image/*, .pdf, .doc, .docx, .zip"/>
        <q-input v-model="newMessage" type="textarea" outlined dense rounded autogrow class="col" placeholder="메시지를 입력하세요..." @keyup.enter="handleEnterkey" :disable="!isConnected" bg-color="grey-2">
          <template v-slot:prepend>
            <q-btn round dense flat icon="attach_file" color="grey-7" @click="triggerFileSelect" :disable="!isConnected"/>
          </template>
          <template v-slot:append>
            <q-btn flat round dense icon="emoji_emotions" color="grey-6">
              <EmoticonPicker @select="sendEmoticon" />
            </q-btn>
          </template>
        </q-input>
        <q-btn round dense icon="send" color="primary" @click="sendMessage" :disable="!newMessage.trim() || !isConnected">
          <q-tooltip>전송</q-tooltip>
        </q-btn>
      </div>
    </div>
  </q-page>

  <q-dialog v-model="imageDialog">
    <q-card style="min-width: 80vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ selectedImage?.content }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-img :src="selectedImage ? `${api.defaults.baseURL}/file/info/${selectedImage.fileId}/${props.userId}` : ''" fit="contain" style="max-height: 70vh;"/>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="다운로드" color="primary" @click="downloadFile(selectedImage)"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- 팀채팅 생성 다이얼로그 -->
  <q-dialog v-model="showTeamChatDialog" persistent>
    <q-card style="min-width: 350px; max-height: 80vh">
      <q-card-section>
        <div class="text-h6">팀채팅 만들기</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="teamChatSearch" dense outlined placeholder="친구 검색..." clearable>
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section v-if="selectedFriends.length > 0" class="q-pt-none">
        <q-chip
          v-for="friend in selectedFriends"
          :key="friend.user_id"
          removable
          color="primary"
          text-color="white"
          @remove="toggleFriendSelection(friend)"
        >
          {{ friend.user_name }}
        </q-chip>
      </q-card-section>

      <q-card-section style="max-height: 300px; overflow-y: auto" class="q-pt-none">
        <q-list separator>
          <q-item
            v-for="user in filteredTeamChatUsers"
            :key="user.user_id"
            clickable
            @click="toggleFriendSelection(user)"
          >
            <q-item-section side>
              <q-checkbox :model-value="isSelected(user)" @update:model-value="toggleFriendSelection(user)" />
            </q-item-section>
            <q-item-section avatar>
              <q-avatar color="grey-4">
                <q-icon name="person" />
              </q-avatar>
            </q-item-section>
            <q-item-section>{{ user.user_name }}</q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="취소" color="grey" @click="closeTeamChatDialog" />
        <q-btn flat label="생성" color="primary" :disable="selectedFriends.length < 1" @click="inviteMembers" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- 반응 선택 다이얼로그 (모바일 long press용) -->
  <q-dialog v-model="reactionDialog" position="bottom">
    <q-card class="reaction-dialog-card">
      <q-card-section class="q-pa-md">
        <div class="text-subtitle2 text-grey-7 q-mb-sm">반응 선택</div>
        <div class="reaction-dialog-grid">
          <div
            v-for="reaction in reactionList"
            :key="reaction.id"
            class="reaction-dialog-item"
            @click="selectReactionFromDialog(reaction)"
          >
            <q-img
              :src="`/reaction/${reaction.file}`"
              :alt="reaction.name"
              width="40px"
              height="40px"
              fit="contain"
            />
            <div class="text-caption text-grey-7">{{ reaction.name }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
/* eslint-disable no-unused-vars */
import { ref, computed, onMounted, onUnmounted, nextTick, watch, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useMessageStore } from 'stores/messageStore.js'
import {messageApi} from "src/api/messageApi.js"
import {fileApi} from "src/api/fileApi.js"
import {api} from 'boot/axios'
import {userApi} from "src/api/userApi.js"
import {roomApi} from "src/api/roomApi.js"
import EmoticonPicker from "src/components/EmoticonPicker.vue"
import ReactionPicker from "src/components/ReactionPicker.vue"
import MessageReactions from "src/components/MessageReactions.vue"
import { useReactionStore } from 'stores/reactionStore.js'

const STATIC_BASE_URL = process.env.API_BASE_URL === '/api'
  ? ''  // 프로덕션: 상대 경로 사용 (nginx가 /static을 백엔드로 프록시)
  : (process.env.API_BASE_URL || 'http://localhost:8000')

const getProfileImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  return `${STATIC_BASE_URL}${imageUrl}`
}

// Vue2: this.$router, this.$route
// Vue3: useRouter(), useRoute()
const router = useRouter()
const $q = useQuasar()
const messageStore = useMessageStore()
const reactionStore = useReactionStore()

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
const imageDialog = ref(false)
const selectedImage = ref(null)
const isSending = ref(false)
const showTeamChatDialog = ref(false)
const selectedFriends = ref([])
const teamChatSearch = ref('')
const userList = ref()
const reactionDialog = ref(false)
const reactionList = ref([])
const longPressedMessage = ref(null)

// computed로 안전하게 가져오기
/** Computed - START **/
const currentMessages = computed(() =>
  messageStore.xRoomsMessages.get(props.roomId) || []
)
const isConnected = computed(() => messageStore.isConnected)
const isLoading = computed(() => messageStore.isLoading)
// 팀채팅 친구 목록 필터링
const filteredTeamChatUsers = computed(() => {
  if (!userList.value) return []
  if (!teamChatSearch.value) return userList.value
  const query = teamChatSearch.value.toLowerCase()
  return userList.value.filter(u =>
    u.user_name?.toLowerCase().includes(query) ||
    u.user_id?.toLowerCase().includes(query)
  )
})

/** Computed - END **/

onBeforeMount(() => {
  if (!messageStore.xRoomsMessages.has(props.roomId)) {
    messageStore.xRoomsMessages.set(props.roomId, [])
  }
})
onMounted(async () => {
  // 사용자 목록 먼저 로드
  const returnUserData = await userApi.findUserList()

  // WebSocket 연결 확인 (새로고침 시 연결이 끊어진 경우 재연결)
  if (!messageStore.isConnected) {
    await messageStore.connectToServer(returnUserData.data.users, props.userId)
  }

  const normalizedMessages = await messageApi.findMessagesByRoomId(props.roomId, messageStore.members)
  messageStore.xRoomsMessages.set(props.roomId, normalizedMessages)

  // 반응 데이터 로드
  await reactionStore.loadRoomReactions(props.roomId)

  // 반응 목록 로드 (다이얼로그용)
  try {
    const response = await fetch('/reaction/reactions.json')
    const data = await response.json()
    reactionList.value = data.reactions
  } catch (error) {
    console.error('반응 목록 로드 실패:', error)
  }

  if (currentMessages.value.length > 0){
    const msgLnNo = currentMessages.value[currentMessages.value.length-1].lastUpdateMessageLnNo
    await messageStore.updateLastRead(props.roomId, msgLnNo)
    scrollToBottom()
  }
  const roomInfo = await roomApi.findRoomInfoByRoomId(props.roomId)
  userList.value = returnUserData.data.users.filter(user => !roomInfo.data.members.includes(user.user_id))
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
const toggleFriendSelection = (user) => {
  const idx = selectedFriends.value.findIndex(f => f.user_id === user.user_id)
  if (idx > -1) {
    selectedFriends.value.splice(idx, 1)
  } else {
    selectedFriends.value.push(user)
  }
}

const isSelected = (user) => {
  return selectedFriends.value.some(f => f.user_id === user.user_id)
}

const closeTeamChatDialog = () => {
  nextTick()
  showTeamChatDialog.value = false
  selectedFriends.value = []
  teamChatSearch.value = ''
}

const scrollToBottom = async () => {
  await nextTick()
  if (scrollAreaRef.value) {
    scrollAreaRef.value.scrollTop = scrollAreaRef.value.scrollHeight
  }
}

const handleEnterkey = async (event) => {
  // Shift + Enter: 개행 허용
  if (event.shiftKey) {
    return  // 기본 동작(개행) 허용
  }
  event.preventDefault()  // 기본 개행 방지

  if (isSending.value) {
    return
  }
  await sendMessage()
}

// methods (Vue2의 methods와 동일, 단 그냥 함수로 선언)
const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  isSending.value = true

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
  } finally {
    isSending.value = false
  }
}

const sendEmoticon = async (emoticon) => {
  try {
    const requestBody = {
      room_id: props.roomId,
      sender_id: props.userId,
      message: emoticon.file,
      message_type: 'emoticon'
    }

    await messageStore.sendMessage(requestBody)
    await scrollToBottom()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '이모티콘 전송 실패',
      caption: error.message
    })
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
  const normalizedMessages = await messageApi.findMessagesByRoomIdAndMessageLnNo(roomId, currentMessages.value[0].lastUpdateMessageLnNo, messageStore.members)
  messageStore.appendXRoomsMessages(roomId, normalizedMessages)
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

const viewImage = (msg) => {
  selectedImage.value =  msg
  imageDialog.value = true
}

// 반응 관련 메서드
const hasReactions = (messageLnNo) => {
  return reactionStore.hasReactions(props.roomId, messageLnNo)
}

const getMessageReactions = (messageLnNo) => {
  return reactionStore.getMessageReactions(props.roomId, messageLnNo)
}

const handleReactionSelect = async (msg, reaction) => {
  try {
    await reactionStore.toggleReaction(
      props.roomId,
      msg.lastUpdateMessageLnNo,
      reaction.id,
      props.userId,
      props.username
    )
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '반응 추가 실패',
      caption: error.message
    })
  }
}

const handleReactionToggle = async ({ type, messageLnNo }) => {
  try {
    await reactionStore.toggleReaction(
      props.roomId,
      messageLnNo,
      type,
      props.userId,
      props.username
    )
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '반응 변경 실패',
      caption: error.message
    })
  }
}

// 모바일 long press 핸들러
const handleLongPress = (msg) => {
  longPressedMessage.value = msg
  reactionDialog.value = true
}

// 다이얼로그에서 반응 선택
const selectReactionFromDialog = async (reaction) => {
  if (!longPressedMessage.value) return

  try {
    await reactionStore.toggleReaction(
      props.roomId,
      longPressedMessage.value.lastUpdateMessageLnNo,
      reaction.id,
      props.userId,
      props.username
    )
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '반응 추가 실패',
      caption: error.message
    })
  } finally {
    reactionDialog.value = false
    longPressedMessage.value = null
  }
}

const handleLeaveRoom = () => {
  // 확인 다이얼로그
  $q.dialog({
    title: '채팅방 나가기',
    message: '정말로 이 채팅방을 나가시겠습니까?',
    cancel: {
      label: '취소',
      color: 'grey',
      flat: true
    },
    ok: {
      label: '나가기',
      color: 'negative',
      flat: true
    },
    persistent: true
  }).onOk(async () => {
    try {
      await roomApi.leaveXRoom(props.roomId)
      const requestBody = {
        room_id: props.roomId,
        sender_id: props.userId,
        message: props.username + "님이 채팅방을 나갔습니다.",
        message_type: "system"
      }
      await messageStore.sendMessage(requestBody)
      $q.notify({
        type: 'positive',
        message: '채팅방을 나갔습니다'
      })
      messageStore.clearLeavedRoomMessage(props.roomId)
      // 채팅방 목록으로 이동
      router.push(`/hl-chat/${props.username}/${props.userId}`)
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: '채팅방 나가기에 실패했습니다'
      })
    }
  })
}

const inviteMembers = async () => {
  const members = selectedFriends.value.map(f => f.user_id)
  const newMembers = await roomApi.inviteMembers(props.roomId, members)
  userList.value = [...userList.value, ...newMembers.data.users]
  let msg = props.username + "님이 "
  for (let i = 0; i < newMembers.data.users.length; i++) {
    msg += newMembers.data.users[i].user_name + "님, "
  }
  msg = msg.trimEnd().slice(0, -1)
  msg += "을 초대했습니다."
  const requestBody = {
    room_id: props.roomId,
    sender_id: props.userId,
    message: msg,
    message_type: "system"
  }
  await messageStore.sendMessage(requestBody)
  closeTeamChatDialog()
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

.my-message-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.other-message-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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

.chat-input-container {
  border-top: 1px solid #e0e0e0;
  background: white;
}

.chat-input {
  max-height: 150px;  /* 최대 높이 제한 */
}

/* 이모티콘 메시지 */
.emoticon-message {
  padding: 4px;
}

/* 반응 관련 스타일 */
.message-content-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reaction-add-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.message-content-row:hover .reaction-add-btn {
  opacity: 0.7;
}

.reaction-add-btn:hover {
  opacity: 1 !important;
}

.my-reactions {
  justify-content: flex-end;
  padding-right: 4px;
}

.other-reactions {
  justify-content: flex-start;
  padding-left: 4px;
}

/* 반응 선택 다이얼로그 (모바일) */
.reaction-dialog-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px 16px 0 0;
}

.reaction-dialog-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  max-height: 280px;
  overflow-x: hidden;
  overflow-y: auto;
}

.reaction-dialog-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.reaction-dialog-item:hover {
  background-color: #f0f0f0;
}

.reaction-dialog-item:active {
  background-color: #e0e0e0;
  transform: scale(0.95);
}
</style>
