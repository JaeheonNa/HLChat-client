<template>
  <q-btn
    class="kakao-login-btn full-width"
    unelevated
    no-caps
    size="lg"
    :loading="loading"
    @click="handleKakaoLogin"
  >
    <div class="flex items-center justify-center">
      <svg
        class="kakao-icon q-mr-sm"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.84 5.18 4.6 6.54-.2.76-.74 2.74-.84 3.18-.14.54.2.54.42.4.18-.12 2.82-1.92 3.96-2.7.6.08 1.22.12 1.86.12 5.52 0 10-3.48 10-7.78S17.52 3 12 3z"
          fill="#3C1E1E"
        />
      </svg>
      <span class="kakao-text">카카오 로그인</span>
    </div>
  </q-btn>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { userApi } from 'src/api/userApi'

const $q = useQuasar()
const loading = ref(false)

const handleKakaoLogin = async () => {
  loading.value = true
  try {
    const response = await userApi.getKakaoAuthUrl()
    window.location.href = response.data.auth_url
  } catch (error) {
    console.error('Kakao login error:', error)
    $q.notify({
      type: 'negative',
      message: '카카오 로그인 연결에 실패했습니다',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.kakao-login-btn {
  background-color: #FEE500 !important;
  color: #3C1E1E !important;
  height: 48px;
}

.kakao-login-btn:hover {
  background-color: #F5DC00 !important;
}

.kakao-icon {
  flex-shrink: 0;
}

.kakao-text {
  font-weight: 500;
  font-size: 15px;
}
</style>
