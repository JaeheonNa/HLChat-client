<template>
  <q-page class="login-page flex flex-center">
    <q-card class="login-card" flat>
      <q-card-section class="text-center q-pt-lg">
        <img
          src="~assets/hl-holdings-logo.png"
          alt="HL Holdings"
          class="logo"
        />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form @submit="handleLogin">
          <q-input
            v-model="loginForm.user_id"
            label="사번"
            outlined
            dense
            :rules="[val => !!val || '사번을 입력하세요']"
            class="q-mb-md"
            @update:model-value="val => loginForm.user_id = val?.toUpperCase()"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="loginForm.password"
            label="비밀번호"
            type="password"
            outlined
            dense
            :rules="[val => !!val || '비밀번호를 입력하세요']"
            class="q-mb-lg"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-btn
            type="submit"
            color="primary"
            label="로그인"
            class="full-width"
            size="lg"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <div class="link-section">
          <span class="text-link" @click="showRegisterDialog = true">회원가입</span>
          <q-separator vertical class="q-mx-sm" />
          <span class="text-link" @click="showPasswordDialog = true">비밀번호 변경</span>
        </div>
      </q-card-section>
    </q-card>

    <RegisterDialog
      v-model="showRegisterDialog"
      @success="onRegisterSuccess"
    />

    <PasswordChangeDialog
      v-model="showPasswordDialog"
      :forced="forcePasswordChange"
      :user-id="loginForm.user_id"
      @success="onPasswordChangeSuccess"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { authApi } from 'boot/axios.js'
import RegisterDialog from 'src/components/RegisterDialog.vue'
import PasswordChangeDialog from 'src/components/PasswordChangeDialog.vue'

const router = useRouter()
const $q = useQuasar()

const loginForm = ref({
  user_id: '',
  password: ''
})
const loading = ref(false)
const showRegisterDialog = ref(false)
const showPasswordDialog = ref(false)
const forcePasswordChange = ref(false)

const handleLogin = async () => {
  loading.value = true

  try {
    const response = await authApi.login(loginForm.value)

    if (response.data.password_expired) {
      forcePasswordChange.value = true
      showPasswordDialog.value = true
      $q.notify({
        type: 'warning',
        message: '비밀번호 변경이 필요합니다',
        position: 'top'
      })
      return
    }

    sessionStorage.setItem('access_token', response.data.access_token)

    $q.notify({
      type: 'positive',
      message: '로그인 성공!',
      position: 'top'
    })

    await router.push(`/hl-chat/${response.data.username}/${loginForm.value.user_id}`)

  } catch (error) {
    console.error('Login error:', error)

    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || '로그인에 실패했습니다',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

const onRegisterSuccess = () => {
  $q.notify({
    type: 'info',
    message: '회원가입 완료! 로그인해주세요.',
    position: 'top'
  })
}

const onPasswordChangeSuccess = () => {
  forcePasswordChange.value = false
  loginForm.value.password = ''
  $q.notify({
    type: 'info',
    message: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.',
    position: 'top'
  })
}
</script>

<style scoped>
.login-page {
  background-color: #ffffff;
  min-height: 100vh;
}

.login-card {
  width: 100%;
  max-width: 380px;
  background-color: #ffffff;
}

.logo {
  max-width: 200px;
  height: auto;
  margin-bottom: 24px;
}

.link-section {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  font-size: 14px;
}

.text-link {
  cursor: pointer;
  color: #1976d2;
}

.text-link:hover {
  text-decoration: underline;
}
</style>
