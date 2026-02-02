<template>
  <q-page padding>
    <!-- 탭 헤더 -->
    <q-tabs
      v-model="activeTab"
      class="text-primary"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      role="tablist"
      aria-label="채팅 네비게이션"
    >
      <q-tab name="chats" icon="chat" role="tab" :aria-selected="activeTab === 'chats'">
        <span class="q-ml-sm">대화 목록</span>
        <q-badge
          v-if="totalUnreadCount > 0"
          color="red"
          floating
          :label="totalUnreadCount > 99 ? '99+' : totalUnreadCount"
        />
      </q-tab>
      <q-tab name="friends" icon="people" label="친구 목록" role="tab" :aria-selected="activeTab === 'friends'" />
    </q-tabs>

    <q-separator />

    <!-- 검색창 -->
    <div class="q-pa-sm">
      <q-input
        v-model="searchInput"
        dense
        outlined
        :placeholder="activeTab === 'chats' ? '대화방 검색...' : '친구 검색...'"
        clearable
        aria-label="검색"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Pull-to-refresh로 감싼 탭 콘텐츠 -->
    <q-pull-to-refresh @refresh="onRefresh">
      <q-tab-panels v-model="activeTab" animated>
        <!-- 대화 목록 탭 -->
        <q-tab-panel name="chats" aria-labelledby="tab-chats">
          <!-- 에러 상태 -->
          <div v-if="hasError" class="text-center q-pa-lg">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md" />
            <div class="text-h6 text-negative q-mb-sm">데이터를 불러올 수 없습니다</div>
            <div class="text-body2 text-grey-6 q-mb-md">{{ errorMessage }}</div>
            <q-btn color="primary" icon="refresh" label="다시 시도" @click="loadData" />
          </div>

          <!-- 스켈레톤 로딩 -->
          <ListSkeleton v-else-if="isLoading" :count="5" />

          <!-- 실제 대화 목록 -->
          <template v-else-if="sortedRoomList.length > 0">
            <!-- 고정된 대화방 섹션 -->
            <template v-if="pinnedRoomList.length > 0">
              <q-item-label header class="text-weight-bold">
                <q-icon name="push_pin" color="amber" class="q-mr-xs" />
                고정된 대화
              </q-item-label>
              <q-list separator role="list" aria-label="고정된 대화 목록">
                <ChatRoomItem
                  v-for="room in pinnedRoomList"
                  :key="'pinned-' + room.roomId"
                  :room="room"
                  :is-pinned="true"
                  :is-group="isGroupChat(room)"
                  :format-time="formatTime"
                  @select="selectRoom"
                  @pin="togglePinRoom"
                  @mute="handleMuteRoom"
                  @leave="handleLeaveRoom"
                />
              </q-list>
              <q-separator class="q-my-sm" />
            </template>

            <!-- 일반 대화방 섹션 -->
            <q-item-label v-if="pinnedRoomList.length > 0" header class="text-weight-bold">
              <q-icon name="chat" color="primary" class="q-mr-xs" />
              대화 목록
            </q-item-label>
            <q-virtual-scroll
              :items="unpinnedRoomList"
              separator
              v-slot="{ item: room }"
              style="max-height: calc(100vh - 280px)"
              role="list"
              aria-label="대화 목록"
            >
              <ChatRoomItem
                :key="room.roomId"
                :room="room"
                :is-pinned="false"
                :is-group="isGroupChat(room)"
                :format-time="formatTime"
                @select="selectRoom"
                @pin="togglePinRoom"
                @mute="handleMuteRoom"
                @leave="handleLeaveRoom"
              />
            </q-virtual-scroll>
          </template>

          <!-- 검색 결과 없음 -->
          <div v-else-if="searchQuery && roomList.length > 0" class="text-center text-grey-6 q-pa-lg">
            <q-icon name="search_off" size="64px" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">"{{ searchQuery }}" 검색 결과가 없습니다</div>
            <div class="text-body2">다른 검색어를 시도해 보세요</div>
          </div>

          <!-- 대화 목록 없음 -->
          <div v-else class="text-center text-grey-6 q-pa-lg">
            <q-icon name="chat_bubble_outline" size="64px" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">대화 목록이 없습니다</div>
            <div class="text-body2 q-mb-md">친구와 대화를 시작해 보세요</div>
            <div class="q-gutter-sm">
              <q-btn color="primary" icon="chat" label="새 대화" @click="activeTab = 'friends'" />
            </div>
          </div>
        </q-tab-panel>

        <!-- 친구 목록 탭 -->
        <q-tab-panel name="friends" aria-labelledby="tab-friends">
          <!-- 에러 상태 -->
          <div v-if="hasError" class="text-center q-pa-lg">
            <q-icon name="error_outline" size="64px" color="negative" class="q-mb-md" />
            <div class="text-h6 text-negative q-mb-sm">데이터를 불러올 수 없습니다</div>
            <div class="text-body2 text-grey-6 q-mb-md">{{ errorMessage }}</div>
            <q-btn color="primary" icon="refresh" label="다시 시도" @click="loadData" />
          </div>

          <!-- 스켈레톤 로딩 -->
          <ListSkeleton v-else-if="isLoading" :count="5" primary-width="30%" secondary-width="50%" />

          <!-- 실제 친구 목록 -->
          <template v-else-if="sortedUserList.length > 0">
            <!-- 즐겨찾기 섹션 -->
            <template v-if="favoriteUsers.length > 0">
              <q-item-label header class="text-weight-bold">
                <q-icon name="star" color="amber" class="q-mr-xs" />
                즐겨찾기
              </q-item-label>
              <q-list separator role="list" aria-label="즐겨찾기 친구 목록">
                <FriendItem
                  v-for="user in favoriteUsers"
                  :key="'fav-' + user.user_id"
                  :user="user"
                  :is-favorite="true"
                  @select="selectUser"
                  @toggle-favorite="toggleFavorite"
                  @remove="handleRemoveFriend"
                  @block="handleBlockUser"
                />
              </q-list>
              <q-separator class="q-my-sm" />
            </template>

            <!-- 전체 친구 섹션 -->
            <q-item-label header class="text-weight-bold">
              <q-icon name="people" color="primary" class="q-mr-xs" />
              친구 목록
            </q-item-label>
            <q-virtual-scroll
              :items="nonFavoriteUsers"
              separator
              v-slot="{ item: user }"
              style="max-height: calc(100vh - 280px)"
              role="list"
              aria-label="친구 목록"
            >
              <FriendItem
                :key="user.user_id"
                :user="user"
                :is-favorite="false"
                @select="selectUser"
                @toggle-favorite="toggleFavorite"
                @remove="handleRemoveFriend"
                @block="handleBlockUser"
              />
            </q-virtual-scroll>
          </template>

          <!-- 검색 결과 없음 -->
          <div v-else-if="searchQuery && userList && userList.length > 0" class="text-center text-grey-6 q-pa-lg">
            <q-icon name="search_off" size="64px" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">"{{ searchQuery }}" 검색 결과가 없습니다</div>
            <div class="text-body2">다른 검색어를 시도해 보세요</div>
          </div>

          <!-- 친구 목록 없음 -->
          <div v-else class="text-center text-grey-6 q-pa-lg">
            <q-icon name="people_outline" size="64px" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">친구 목록이 없습니다</div>
            <div class="text-body2 q-mb-md">친구를 추가하고 대화를 시작해 보세요</div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-pull-to-refresh>

    <!-- 대화방 나가기 확인 다이얼로그 -->
    <q-dialog v-model="showLeaveDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">대화방 나가기</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          정말로 이 대화방을 나가시겠습니까?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="취소" color="grey" v-close-popup />
          <q-btn flat label="나가기" color="negative" @click="confirmLeaveRoom" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 친구 삭제 확인 다이얼로그 -->
    <q-dialog v-model="showRemoveDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">친구 삭제</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          정말로 이 친구를 삭제하시겠습니까?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="취소" color="grey" v-close-popup />
          <q-btn flat label="삭제" color="negative" @click="confirmRemoveFriend" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 차단 확인 다이얼로그 -->
    <q-dialog v-model="showBlockDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">사용자 차단</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          이 사용자를 차단하시겠습니까? 차단하면 메시지를 주고받을 수 없습니다.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="취소" color="grey" v-close-popup />
          <q-btn flat label="차단" color="negative" @click="confirmBlockUser" v-close-popup />
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
          <q-btn flat label="생성" color="primary" :disable="selectedFriends.length < 1" @click="createTeamChat" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- FAB 버튼 -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-fab icon="add" color="primary" direction="up">
        <q-fab-action color="accent" icon="groups" label="팀채팅" @click="showTeamChatDialog = true" />
      </q-fab>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
/* eslint-disable no-unused-vars */
import { nextTick, onMounted, ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { userApi } from 'src/api/userApi.js'
import { useQuasar } from 'quasar'
import { roomApi } from 'src/api/roomApi.js'
import { useMessageStore } from 'stores/messageStore.js'
import ListSkeleton from 'src/components/ListSkeleton.vue'
import ChatRoomItem from 'src/components/ChatRoomItem.vue'
import FriendItem from 'src/components/FriendItem.vue'

const props = defineProps({
  username: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
})

const messageStore = useMessageStore()
const router = useRouter()
const $q = useQuasar()

// 기본 상태
const activeTab = ref('chats')
const roomId = ref()
const username = ref(props.username)
const userId = ref(props.userId)
const userList = ref()
const roomList = ref([])
const isLoading = ref(true)

// 에러 상태
const hasError = ref(false)
const errorMessage = ref('')

// 검색 (debounce 적용)
const searchInput = ref('')
const searchQuery = ref('')
const debouncedSearch = useDebounceFn((value) => {
  searchQuery.value = value
}, 300)

watch(searchInput, (newValue) => {
  debouncedSearch(newValue)
})

// localStorage 상태
const favorites = ref(JSON.parse(localStorage.getItem('favorites') || '[]'))
const pinnedRooms = ref(JSON.parse(localStorage.getItem('pinnedRooms') || '[]'))

// 다이얼로그 상태
const showLeaveDialog = ref(false)
const showRemoveDialog = ref(false)
const showBlockDialog = ref(false)
const showTeamChatDialog = ref(false)
const pendingLeaveRoomId = ref(null)
const pendingRemoveUserId = ref(null)
const pendingBlockUserId = ref(null)

// 팀채팅 관련 상태
const selectedFriends = ref([])
const teamChatSearch = ref('')

// 읽지 않은 메시지 총 개수
const totalUnreadCount = computed(() => {
  return roomList.value.reduce((sum, room) => sum + (room.lastRead || 0), 0)
})

// 검색 필터링된 대화 목록
const filteredRoomList = computed(() => {
  if (!searchQuery.value) return roomList.value
  const query = searchQuery.value.toLowerCase()
  return roomList.value.filter(
    (room) =>
      room.roomName?.toLowerCase().includes(query) || room.content?.toLowerCase().includes(query)
  )
})

// 고정된 대화방
const pinnedRoomList = computed(() => {
  return filteredRoomList.value.filter((room) => pinnedRooms.value.includes(room.roomId))
})

// 고정되지 않은 대화방
const unpinnedRoomList = computed(() => {
  return filteredRoomList.value.filter((room) => !pinnedRooms.value.includes(room.roomId))
})

// 정렬된 대화 목록 (고정 + 일반)
const sortedRoomList = computed(() => {
  return [...pinnedRoomList.value, ...unpinnedRoomList.value]
})

// 그룹 채팅 여부 판별
const isGroupChat = (room) => {
  return room.participantCount > 2 || room.roomType === 'group' || room.roomName?.includes(',')
}

// 사용자 목록
const enrichedUserList = computed(() => {
  if (!userList.value) return []
  return userList.value
})

// 검색 필터링된 친구 목록
const filteredUserList = computed(() => {
  if (!enrichedUserList.value.length) return []
  if (!searchQuery.value) return enrichedUserList.value
  const query = searchQuery.value.toLowerCase()
  return enrichedUserList.value.filter(
    (user) =>
      user.user_name?.toLowerCase().includes(query) || user.user_id?.toLowerCase().includes(query)
  )
})

// 정렬된 사용자 목록 (이름순)
const sortedUserList = computed(() => {
  return [...filteredUserList.value].sort((a, b) => {
    return a.user_name.localeCompare(b.user_name)
  })
})

// 즐겨찾기 사용자
const favoriteUsers = computed(() => {
  return sortedUserList.value.filter((user) => favorites.value.includes(user.user_id))
})

// 즐겨찾기 아닌 사용자
const nonFavoriteUsers = computed(() => {
  return sortedUserList.value.filter((user) => !favorites.value.includes(user.user_id))
})

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

// 데이터 로드 함수 (에러 처리 통합)
const loadData = async () => {
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    const returnUserData = await userApi.findUserList()
    userList.value = returnUserData.data.users
    await messageStore.connectToServer(userList.value)
  } catch (error) {
    hasError.value = true
    errorMessage.value = error.message || '데이터를 불러오는 중 오류가 발생했습니다'
    $q.notify({
      type: 'negative',
      message: '데이터 로딩 실패',
      caption: error.message,
    })
  } finally {
    isLoading.value = false
  }
}

// Pull-to-refresh 핸들러
const onRefresh = async (done) => {
  await loadData()
  done()
}

onMounted(async () => {
  await loadData()
})

// 탭 전환 시 검색어 초기화
watch(activeTab, () => {
  searchInput.value = ''
  searchQuery.value = ''
})

// 메시지 수신 감시
watch(
  () => messageStore.rcvMessageCnt,  // 감시할 값만 반환
  async (newValue, oldValue) => {    // 값 변경 시 실행
    // console.log("messageStore.rcvMessageCnt: " + newValue + oldValue)
    await nextTick()
    roomList.value = [...messageStore.lastMessages]
      .sort((a, b) => {
        const dateA = a[1]['timestamp']
        const dateB = b[1]['timestamp']
        return new Date(dateB) - new Date(dateA)
      })
      .map(([roomId, messageData]) => {
        return messageData
      })
  }
)
const enterRoom = () => {
  router.push(`/hl-chat/${username.value}/${userId.value}/${roomId.value}`)
}

const selectRoom = (room) => {
  roomId.value = room.roomId
  enterRoom()
}

const selectUser = async (event) => {
  const me = userId.value
  const friend = event.user_id
  const returnData = await roomApi.findRoomId(me, friend)
  roomId.value = returnData.data
  enterRoom()
}

// 시간 포맷
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

// 즐겨찾기 토글
const toggleFavorite = (userId) => {
  const index = favorites.value.indexOf(userId)
  if (index > -1) {
    favorites.value.splice(index, 1)
  } else {
    favorites.value.push(userId)
  }
  localStorage.setItem('favorites', JSON.stringify(favorites.value))
}

// 대화방 고정 토글
const togglePinRoom = (roomId) => {
  const index = pinnedRooms.value.indexOf(roomId)
  if (index > -1) {
    pinnedRooms.value.splice(index, 1)
    $q.notify({
      type: 'info',
      message: '대화방 고정이 해제되었습니다',
      timeout: 1500,
    })
  } else {
    pinnedRooms.value.push(roomId)
    $q.notify({
      type: 'positive',
      message: '대화방이 고정되었습니다',
      timeout: 1500,
    })
  }
  localStorage.setItem('pinnedRooms', JSON.stringify(pinnedRooms.value))
}

// 대화방 알림 끄기 (서버 API 미구현 - UI만)
const handleMuteRoom = () => {
  $q.notify({
    type: 'info',
    message: '알림이 꺼졌습니다',
    caption: '이 기능은 추후 지원 예정입니다',
    timeout: 2000,
  })
}

// 대화방 나가기
const handleLeaveRoom = (roomId) => {
  pendingLeaveRoomId.value = roomId
  showLeaveDialog.value = true
}

const confirmLeaveRoom = () => {
  $q.notify({
    type: 'warning',
    message: '대화방을 나갔습니다',
    caption: '이 기능은 추후 지원 예정입니다',
    timeout: 2000,
  })
  pendingLeaveRoomId.value = null
}

// 친구 삭제
const handleRemoveFriend = (userId) => {
  pendingRemoveUserId.value = userId
  showRemoveDialog.value = true
}

const confirmRemoveFriend = () => {
  $q.notify({
    type: 'warning',
    message: '친구가 삭제되었습니다',
    caption: '이 기능은 추후 지원 예정입니다',
    timeout: 2000,
  })
  pendingRemoveUserId.value = null
}

// 사용자 차단
const handleBlockUser = (userId) => {
  pendingBlockUserId.value = userId
  showBlockDialog.value = true
}

const confirmBlockUser = () => {
  $q.notify({
    type: 'negative',
    message: '사용자가 차단되었습니다',
    caption: '이 기능은 추후 지원 예정입니다',
    timeout: 2000,
  })
  pendingBlockUserId.value = null
}

// 팀채팅 친구 선택 토글
const toggleFriendSelection = (user) => {
  const idx = selectedFriends.value.findIndex(f => f.user_id === user.user_id)
  if (idx > -1) {
    selectedFriends.value.splice(idx, 1)
  } else {
    selectedFriends.value.push(user)
  }
}

// 친구 선택 여부 확인
const isSelected = (user) => {
  return selectedFriends.value.some(f => f.user_id === user.user_id)
}

// 팀채팅 다이얼로그 닫기
const closeTeamChatDialog = () => {
  showTeamChatDialog.value = false
  selectedFriends.value = []
  teamChatSearch.value = ''
}

// 팀채팅 생성
const createTeamChat = async () => {
  try {
    const members = selectedFriends.value.map(f => f.user_id)
    const result = await roomApi.createGroupRoom(members)
    roomId.value = result.data
    closeTeamChatDialog()
    enterRoom()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '팀채팅 생성 실패',
      caption: error.message,
    })
  }
}
</script>

<style scoped>
</style>
