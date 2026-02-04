<template>
  <q-popup-proxy
    ref="popupRef"
    anchor="top left"
    self="bottom left"
    :offset="[0, 8]"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="reaction-picker">
      <q-card-section class="q-pa-sm">
        <div v-if="isLoading" class="flex flex-center q-pa-sm">
          <q-spinner-dots color="primary" size="24px" />
        </div>
        <div v-else class="reaction-scroll">
          <div class="reaction-grid">
            <div
              v-for="reaction in reactions"
              :key="reaction.id"
              class="reaction-item"
              @click="selectReaction(reaction)"
            >
              <q-img
                :src="`/reaction/${reaction.file}`"
                :alt="reaction.name"
                width="32px"
                height="32px"
                fit="contain"
              />
              <q-tooltip>{{ reaction.name }}</q-tooltip>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-popup-proxy>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['select'])

const popupRef = ref(null)
const reactions = ref([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const response = await fetch('/reaction/reactions.json')
    const data = await response.json()
    reactions.value = data.reactions
  } catch (error) {
    console.error('반응 목록 로드 실패:', error)
  } finally {
    isLoading.value = false
  }
})

const selectReaction = (reaction) => {
  emit('select', reaction)
  popupRef.value?.hide()
}

// 외부에서 호출할 수 있도록 expose
defineExpose({
  hide: () => popupRef.value?.hide()
})
</script>

<style scoped>
.reaction-picker {
  width: 240px;
}

.reaction-scroll {
  max-height: 240px; /* 약 5줄 */
  overflow-x: hidden;
  overflow-y: auto;
}

.reaction-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.reaction-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reaction-item:hover {
  background-color: #f0f0f0;
  transform: scale(1.1);
}

.reaction-item:active {
  transform: scale(0.95);
}
</style>
