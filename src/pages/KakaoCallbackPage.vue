<template>
  <q-page class="flex flex-center">
    <div class="text-center">
      <q-spinner-dots color="primary" size="50px" />
      <div class="q-mt-md text-grey-7">
        {{ statusMessage }}
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { userApi } from 'src/api/userApi'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const statusMessage = ref('카카오 로그인 처리 중...')

const isLinkMode = () => {
  return sessionStorage.getItem('kakao_link_mode') === 'true'
}

const clearLinkMode = () => {
  sessionStorage.removeItem('kakao_link_mode')
  sessionStorage.removeItem('kakao_link_user_id')
}

const getRedirectPath = () => {
  const username = sessionStorage.getItem('username')
  const userId = sessionStorage.getItem('user_id')
  if (username && userId) {
    return `/hl-chat/${username}/${userId}`
  }
  return '/hl-chat/log-in'
}

onMounted(async () => {
  const code = route.query.code
  const error = route.query.error
  const linkMode = isLinkMode()
  const linkUserId = sessionStorage.getItem('kakao_link_user_id')

  console.log('[KakaoCallback] Started', { code: !!code, error, linkMode, linkUserId })

  if (error) {
    clearLinkMode()
    $q.notify({
      type: 'negative',
      message: '카카오 로그인이 취소되었습니다',
      position: 'top'
    })
    await router.replace(linkMode ? getRedirectPath() : '/hl-chat/log-in')
    return
  }

  if (!code) {
    clearLinkMode()
    $q.notify({
      type: 'negative',
      message: '잘못된 접근입니다',
      position: 'top'
    })
    await router.replace('/hl-chat/log-in')
    return
  }

  try {
    statusMessage.value = '사용자 정보 확인 중...'
    // linkMode일 때는 자동 가입하지 않음
    console.log('[KakaoCallback] Calling kakaoCallback API with auto_register:', !linkMode)
    const response = await userApi.kakaoCallback(code, !linkMode)
    console.log('[KakaoCallback] Response:', response.data)

    if (linkMode && linkUserId) {
      console.log('[KakaoCallback] Link mode detected, provider_id:', response.data.provider_id)
      clearLinkMode()

      // 이미 카카오 계정이 다른 사용자에게 연동된 경우
      if (!response.data.provider_id) {
        console.log('[KakaoCallback] Kakao account already linked to another user')
        $q.notify({
          type: 'negative',
          message: '이 카카오 계정은 이미 다른 사용자에게 연동되어 있습니다',
          position: 'top'
        })
        await router.replace(getRedirectPath())
        return
      }

      statusMessage.value = '카카오 계정 연동 중...'

      const linkRequest = {
        user_id: linkUserId,
        provider: 'KAKAO',
        provider_id: response.data.provider_id
      }
      console.log('[KakaoCallback] Calling kakaoLink API with:', linkRequest)
      const linkResponse = await userApi.kakaoLink(linkRequest)
      console.log('[KakaoCallback] Link response:', linkResponse.data)

      sessionStorage.setItem('access_token', linkResponse.data.access_token)

      $q.notify({
        type: 'positive',
        message: '카카오 계정이 연동되었습니다!',
        position: 'top'
      })

      await router.replace(getRedirectPath())
    } else if (response.data.requires_registration) {
      await router.replace({
        path: '/hl-chat/kakao-register',
        query: {
          provider: 'KAKAO',
          provider_id: response.data.provider_id,
          nickname: response.data.nickname || '',
          email: response.data.email || '',
          profile_image: response.data.profile_image || ''
        }
      })
    } else {
      sessionStorage.setItem('access_token', response.data.access_token)
      sessionStorage.setItem('user_id', response.data.user_id)
      sessionStorage.setItem('username', response.data.username)

      $q.notify({
        type: 'positive',
        message: '카카오 로그인 성공!',
        position: 'top'
      })

      await router.replace(`/hl-chat/${response.data.username}/${response.data.user_id}`)
    }
  } catch (error) {
    clearLinkMode()
    console.error('[KakaoCallback] Error:', error)
    console.error('[KakaoCallback] Error response:', error.response?.data)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || '카카오 로그인에 실패했습니다',
      position: 'top'
    })
    await router.replace(linkMode ? getRedirectPath() : '/hl-chat/log-in')
  }
})
</script>

<style scoped>
.q-page {
  min-height: 100vh;
  background-color: #ffffff;
}
</style>
