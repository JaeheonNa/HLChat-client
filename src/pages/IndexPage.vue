<template>
  <q-page padding>
    <div class="q-gutter-md" style="max-width: 600px">
      <h4>메신저 테스트</h4>

      <q-input
        v-model="roomId"
        label="Room ID"
        outlined
      />

      <q-input
        v-model="userId"
        label="User ID"
        outlined
      />

      <q-btn
        color="primary"
        label="채팅방 입장"
        @click="enterRoom"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const roomId = ref(1)
const userId = ref('')

const enterRoom = () => {
  router.push(`/hl-chat/${roomId.value}/${userId.value}`)
}
</script>
