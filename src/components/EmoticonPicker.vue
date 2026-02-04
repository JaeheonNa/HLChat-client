<template>
  <q-popup-proxy
    ref="popupRef"
    anchor="top right"
    self="bottom right"
    :offset="[0, 8]"
    :breakpoint="0"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="emoticon-picker" flat>
      <q-card-section class="q-pa-sm">
        <div class="text-subtitle2 text-grey-7 q-mb-sm">이모티콘</div>
        <div v-if="isLoading" class="flex flex-center q-pa-md">
          <q-spinner-dots color="primary" size="30px" />
        </div>
        <div v-else class="emoticon-scroll">
          <div class="emoticon-grid">
            <div
              v-for="emoticon in emoticons"
              :key="emoticon.id"
              class="emoticon-item"
              @click="selectEmoticon(emoticon)"
            >
              <q-img
                :src="`/emoticon/common/${emoticon.file}`"
                :alt="emoticon.name"
                width="40px"
                height="40px"
                fit="contain"
              />
              <q-tooltip>{{ emoticon.name }}</q-tooltip>
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
const emoticons = ref([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const response = await fetch('/emoticon/common/emoticons.json')
    const data = await response.json()
    emoticons.value = data.emoticons
  } catch (error) {
    console.error('이모티콘 목록 로드 실패:', error)
  } finally {
    isLoading.value = false
  }
})

const selectEmoticon = (emoticon) => {
  emit('select', emoticon)
  popupRef.value?.hide()
}
</script>

<style scoped>
.emoticon-picker {
  width: 320px;
  background: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.emoticon-picker :deep(.q-card__section) {
  background: transparent !important;
}

.emoticon-scroll {
  max-height: 280px; /* 약 5줄 (52px * 5 + gap) */
  overflow-x: hidden;
  overflow-y: auto;
}

.emoticon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.emoticon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.emoticon-item:hover {
  background-color: #f0f0f0;
}

.emoticon-item:active {
  transform: scale(0.95);
}
</style>
