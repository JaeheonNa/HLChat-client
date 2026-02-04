<template>
  <q-dialog v-model="dialogVisible">
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">내 정보</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="text-center q-pt-lg">
        <q-avatar size="100px" class="q-mb-md profile-avatar">
          <img v-if="profile.profile_image" :src="getProfileImageUrl(profile.profile_image)" />
          <q-icon v-else name="person" size="60px" color="grey-5" />
        </q-avatar>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onFileSelect"
        />
        <div>
          <q-btn
            flat
            dense
            color="primary"
            label="사진 변경"
            size="sm"
            @click="$refs.fileInput.click()"
            :loading="uploadingImage"
          />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-list>
          <q-item>
            <q-item-section avatar>
              <q-icon name="badge" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>사번</q-item-label>
              <q-item-label>{{ profile.user_id }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="person" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>이름</q-item-label>
              <q-item-label>{{ profile.user_name }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="email" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>이메일</q-item-label>
              <q-item-label>{{ profile.email || '-' }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="phone" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>전화번호</q-item-label>
              <q-item-label>{{ formatPhone(profile.phone) || '-' }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="profile.provider && profile.provider.toUpperCase() !== 'LOCAL'">
            <q-item-section avatar>
              <q-icon name="link" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label caption>연동 계정</q-item-label>
              <q-item-label>
                <q-badge color="warning" text-color="dark" label="카카오" />
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions vertical class="q-pa-md">
        <div
          v-if="!profile.provider || profile.provider.toUpperCase() === 'LOCAL'"
          class="kakao-link-btn full-width q-mb-sm q-pa-md text-center cursor-pointer"
          style="border-radius: 4px;"
          @click="testClick"
        >
          <svg class="kakao-icon q-mr-sm" width="18" height="18" viewBox="0 0 24 24" fill="none" style="vertical-align: middle; display: inline-block;">
            <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.84 5.18 4.6 6.54-.2.76-.74 2.74-.84 3.18-.14.54.2.54.42.4.18-.12 2.82-1.92 3.96-2.7.6.08 1.22.12 1.86.12 5.52 0 10-3.48 10-7.78S17.52 3 12 3z" fill="#3C1E1E"/>
          </svg>
          <span>카카오 계정 연동</span>
        </div>
        <q-btn
          outline
          color="primary"
          label="비밀번호 변경"
          class="full-width q-mb-sm"
          @click="openPasswordChange"
        />
        <q-btn
          outline
          color="negative"
          label="로그아웃"
          class="full-width"
          @click="handleLogout"
        />
      </q-card-actions>
    </q-card>

    <PasswordChangeDialog
      v-model="showPasswordDialog"
      :user-id="profile.user_id"
      @success="onPasswordChangeSuccess"
    />
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { userApi } from 'src/api/userApi'
import PasswordChangeDialog from 'src/components/PasswordChangeDialog.vue'

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

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const $q = useQuasar()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const profile = ref({
  user_id: '',
  user_name: '',
  email: '',
  phone: '',
  profile_image: '',
  provider: 'LOCAL'
})
const showPasswordDialog = ref(false)
const uploadingImage = ref(false)
const fileInput = ref(null)
const linkingKakao = ref(false)

watch(dialogVisible, (newVal) => {
  if (newVal) {
    loadProfile()
  }
})

const loadProfile = async () => {
  try {
    const response = await userApi.getMyProfile()
    profile.value = response.data
  } catch (error) {
    console.error('Failed to load profile:', error)
    const currentPath = router.currentRoute.value.params
    profile.value = {
      user_id: currentPath.userId || '',
      user_name: currentPath.username || '',
      email: '',
      phone: '',
      profile_image: '',
      provider: 'LOCAL'
    }
  }
}

const testClick = () => {
  console.log('testClick called')
  handleKakaoLink()
}

const handleKakaoLink = () => {
  console.log('handleKakaoLink called')
  linkingKakao.value = true

  userApi.getKakaoAuthUrl()
    .then(response => {
      console.log('Kakao auth URL response:', response.data)
      sessionStorage.setItem('kakao_link_mode', 'true')
      sessionStorage.setItem('kakao_link_user_id', profile.value.user_id)
      console.log('Redirecting to:', response.data.auth_url)
      window.location.href = response.data.auth_url
    })
    .catch(error => {
      console.error('Kakao link error:', error)
      $q.notify({
        type: 'negative',
        message: '카카오 연동에 실패했습니다',
        position: 'top'
      })
    })
    .finally(() => {
      linkingKakao.value = false
    })
}

const formatPhone = (phone) => {
  if (!phone) return null
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

const onFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    $q.notify({ type: 'negative', message: '이미지 파일만 업로드 가능합니다', position: 'top' })
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    $q.notify({ type: 'negative', message: '파일 크기는 5MB 이하여야 합니다', position: 'top' })
    return
  }

  uploadingImage.value = true
  try {
    const formData = new FormData()
    formData.append('image', file)
    const response = await userApi.uploadProfileImage(formData)
    profile.value.profile_image = response.data.image_url
    $q.notify({ type: 'positive', message: '프로필 이미지가 변경되었습니다', position: 'top' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || '이미지 업로드에 실패했습니다',
      position: 'top'
    })
  } finally {
    uploadingImage.value = false
    event.target.value = ''
  }
}

const openPasswordChange = () => {
  showPasswordDialog.value = true
}

const onPasswordChangeSuccess = () => {
  $q.notify({ type: 'positive', message: '비밀번호가 변경되었습니다', position: 'top' })
}

const handleLogout = () => {
  $q.dialog({
    title: '로그아웃',
    message: '정말 로그아웃 하시겠습니까?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    sessionStorage.clear()
    dialogVisible.value = false
    router.push('/hl-chat/log-in')
    $q.notify({ type: 'info', message: '로그아웃되었습니다', position: 'top' })
  })
}
</script>

<style scoped>
.profile-avatar {
  background-color: #f5f5f5;
  border: 2px solid #e0e0e0;
}

.kakao-link-btn {
  background-color: #FEE500 !important;
  color: #3C1E1E !important;
}

.kakao-link-btn:hover {
  background-color: #F5DC00 !important;
}

.kakao-icon {
  flex-shrink: 0;
}
</style>
