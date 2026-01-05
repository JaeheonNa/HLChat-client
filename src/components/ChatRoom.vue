<template>
  <q-page class="flex column">
    <!-- 헤더 -->
    <q-toolbar class="bg-primary text-white">
      <q-btn flat round dense icon="arrow_back" @click="goBack" />
      <q-toolbar-title>
        Room: {{ roomId }}
      </q-toolbar-title>
      <q-chip
        :color="isConnected ? 'positive' : 'negative'"
        text-color="white"
        dense
      >
        {{ isConnected ? '연결됨' : '연결 안됨' }}
      </q-chip>
    </q-toolbar>

    <!-- 메시지 리스트 -->
    <div class="col scroll q-pa-md" ref="scrollAreaRef">
      <!-- 로딩 중 -->
      <div v-if="isLoading" class="text-center q-pa-md">
        <q-spinner color="primary" size="3em" />
        <div class="text-grey-6 q-mt-md">연결 중...</div>
      </div>

      <!-- 메시지 없음 -->
      <div v-else-if="messageStore.messages.length === 0" class="text-center text-grey-6 q-pa-md">
        메시지가 없습니다. 첫 메시지를 보내보세요!
      </div>
      <div v-else>
        <!-- 메시지들 -->
        <q-chat-message
          v-for="msg in messageStore.messages"
          :key="msg.id"
          :text="[msg.content]"
          :sent="msg.sender === userName"
          :stamp="formatTime(msg.timestamp)"
          :bg-color="msg.sender === userName ? 'primary' : 'grey-3'"
          :text-color="msg.sender === userName ? 'blue' : 'black'"
        >
          <template v-slot:name v-if="msg.sender !== userName">
            {{ msg.sender }}
          </template>
        </q-chat-message>
      </div>
    </div>

    <!-- 메시지 입력 -->
    <q-separator />
    <q-footer class="bg-white">
      <q-input
        v-model="newMessage"
        outlined
        dense
        class="q-ma-sm"
        placeholder="메시지를 입력하세요..."
        @keyup.enter="sendMessage"
        :disable="!isConnected"
      >
        <template v-slot:append>
          <q-btn
            flat
            round
            dense
            icon="send"
            color="primary"
            @click="sendMessage"
            :disable="!newMessage.trim() || !isConnected"
          />
        </template>
      </q-input>
    </q-footer>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useMessageStore } from 'stores/messageStore'

// Vue2: this.$router, this.$route
// Vue3: useRouter(), useRoute()
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const messageStore = useMessageStore()

// props 받기 (라우터에서 props: true 설정했으므로)
const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
})

// ref 변수들 (Vue2의 data()와 동일)
const newMessage = ref('')
const scrollAreaRef = ref(null)

// query parameter에서 사용자 이름 가져오기
const userName = computed(() => {
  console.log(route.query.userName || '1')
  return props.userId
})

// store에서 데이터 가져오기 (Vue2의 mapState/mapGetters 대신)

const isConnected = computed(() => messageStore.isConnected)
const isLoading = computed(() => messageStore.isLoading)
const scrollToBottom = () => {
  if (scrollAreaRef.value) {
    // q-scroll-area 전용 메서드 대신 일반 JS 스크롤 사용
    scrollAreaRef.value.scrollTop = scrollAreaRef.value.scrollHeight
  }
}
// 라이프사이클 훅 (Vue2: mounted, beforeDestroy)
onMounted(async () => {
  console.log('ChatRoom mounted')
  try {
    await messageStore.connectRoom(props.roomId)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '채팅방 연결 실패',
      caption: error.message
    })
  }
})

onUnmounted(() => {
  console.log('ChatRoom unmounted')
  messageStore.disconnectRoom()
})

// watch: 메시지 추가되면 스크롤 하단으로
watch(() => messageStore.messages.length, async () => {
  await nextTick()
  scrollToBottom()
})
// methods (Vue2의 methods와 동일, 단 그냥 함수로 선언)

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  try {
    const requestBody = {
      room_id: props.roomId,
      sender_id: props.userId,
      receiver_id: ["2", "3"],
      message: newMessage.value,
      message_type: "str"
    }

    await messageStore.sendMessage(requestBody)
    newMessage.value = ''
  } catch (error) {
    // $q.notify({
    //   type: 'negative',
    //   message: '메시지 전송 실패',
    //   caption: error.message
    // })
    console.log(error.message)
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goBack = () => {
  router.push('/')
}
</script>
<style scoped>
:deep(.q-message) {
  z-index: 1000 !important;
  position: relative !important;
}

:deep(.q-message-text) {
  background: white !important;
  color: black !important;
  z-index: 1001 !important;
  position: relative !important;
}
</style>
