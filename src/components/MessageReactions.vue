<template>
  <div v-if="hasAnyReactions" class="message-reactions">
    <div
      v-for="(data, type) in reactions"
      :key="type"
      class="reaction-badge"
      :class="{ 'my-reaction': hasUserReacted(type) }"
      @click="handleToggle(type)"
    >
      <q-img
        :src="`/reaction/${getReactionFile(type)}`"
        width="16px"
        height="16px"
        fit="contain"
      />
      <span class="reaction-count">{{ data.count }}</span>
      <q-tooltip>
        <div class="reaction-tooltip">
          {{ getUserNames(data.users) }}
        </div>
      </q-tooltip>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

const props = defineProps({
  reactions: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    required: true
  },
  messageLnNo: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['toggle'])

const reactionMeta = ref([])

onMounted(async () => {
  try {
    const response = await fetch('/reaction/reactions.json')
    const data = await response.json()
    reactionMeta.value = data.reactions
  } catch (error) {
    console.error('반응 메타데이터 로드 실패:', error)
  }
})

const hasAnyReactions = computed(() => {
  return Object.keys(props.reactions).length > 0
})

const getReactionFile = (type) => {
  const meta = reactionMeta.value.find(r => r.id === type)
  return meta ? meta.file : `${type}.svg`
}

const hasUserReacted = (type) => {
  const reaction = props.reactions[type]
  if (!reaction) return false
  return reaction.users.some(u => u.userId === props.currentUserId)
}

const getUserNames = (users) => {
  if (!users || users.length === 0) return ''
  if (users.length <= 3) {
    return users.map(u => u.userName).join(', ')
  }
  const displayNames = users.slice(0, 3).map(u => u.userName).join(', ')
  return `${displayNames} 외 ${users.length - 3}명`
}

const handleToggle = (type) => {
  emit('toggle', { type, messageLnNo: props.messageLnNo })
}
</script>

<style scoped>
.message-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  padding-left: 4px;
}

.reaction-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 10px;
  background-color: #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.reaction-badge:hover {
  background-color: #e0e0e0;
}

.reaction-badge.my-reaction {
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
}

.reaction-count {
  font-size: 11px;
  font-weight: 500;
  color: #666;
}

.my-reaction .reaction-count {
  color: #1976d2;
}

.reaction-tooltip {
  max-width: 200px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
