<template>
  <q-slide-item
    @left="onLeftSwipe"
    @right="onRightSwipe"
    left-color="amber"
    right-color="negative"
  >
    <template v-slot:left>
      <div class="row items-center">
        <q-icon :name="isPinned ? 'push_pin' : 'push_pin'" class="q-mr-sm" />
        {{ isPinned ? '고정 해제' : '고정' }}
      </div>
    </template>
    <template v-slot:right>
      <div class="row items-center">
        <q-icon name="logout" class="q-mr-sm" />
        나가기
      </div>
    </template>

    <q-item
      clickable
      v-ripple
      @click="$emit('select', room)"
      @contextmenu.prevent="showContextMenu = true"
      role="listitem"
      :aria-label="`채팅방 ${room.roomName}, 읽지 않은 메시지 ${room.lastRead || 0}개`"
    >
      <q-item-section avatar>
        <q-avatar :color="isGroup ? 'purple' : 'primary'" text-color="white">
          <q-icon :name="isGroup ? 'groups' : 'chat'" />
        </q-avatar>
        <q-icon
          v-if="isPinned"
          name="push_pin"
          size="14px"
          color="amber"
          class="pinned-indicator"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ room.roomName }}</q-item-label>
        <q-item-label caption lines="1">{{ displayContent }}</q-item-label>
      </q-item-section>
      <q-item-section side top>
        <q-item-label caption>{{ formatTime(room.timestamp) }}</q-item-label>
        <q-badge
          v-if="room.lastRead > 0"
          color="red"
          :label="room.lastRead > 99 ? '99+' : room.lastRead"
          class="q-mt-xs"
          :aria-label="`읽지 않은 메시지 ${room.lastRead}개`"
        />
      </q-item-section>

      <!-- Context Menu -->
      <q-menu v-model="showContextMenu" touch-position context-menu>
        <q-list style="min-width: 150px">
          <q-item clickable v-close-popup @click="$emit('pin', room.roomId)">
            <q-item-section avatar>
              <q-icon name="push_pin" :color="isPinned ? 'amber' : 'grey'" />
            </q-item-section>
            <q-item-section>{{ isPinned ? '고정 해제' : '고정' }}</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="$emit('mute', room.roomId)">
            <q-item-section avatar>
              <q-icon name="notifications_off" />
            </q-item-section>
            <q-item-section>알림 끄기</q-item-section>
          </q-item>
          <q-separator />
          <q-item clickable v-close-popup @click="$emit('leave', room.roomId)">
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>
            <q-item-section class="text-negative">나가기</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-item>
  </q-slide-item>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const emoticonsMap = ref({})

onMounted(async () => {
  try {
    const response = await fetch('/emoticon/common/emoticons.json')
    const data = await response.json()
    data.emoticons.forEach(e => {
      emoticonsMap.value[e.file] = e.name
    })
  } catch (error) {
    console.error('이모티콘 목록 로드 실패:', error)
  }
})

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isGroup: {
    type: Boolean,
    default: false,
  },
  formatTime: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['select', 'pin', 'mute', 'leave'])

const showContextMenu = ref(false)

const displayContent = computed(() => {
  // messageType이 emoticon이거나, content가 이모티콘 파일명인 경우
  if (props.room.messageType === 'emoticon' || emoticonsMap.value[props.room.content]) {
    const name = emoticonsMap.value[props.room.content]
    return name ? `(${name})` : props.room.content
  }
  return props.room.content
})

const onLeftSwipe = ({ reset }) => {
  emit('pin', props.room.roomId)
  reset()
}

const onRightSwipe = ({ reset }) => {
  emit('leave', props.room.roomId)
  reset()
}
</script>

<style scoped>
.pinned-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
}
</style>
