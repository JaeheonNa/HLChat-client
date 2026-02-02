<!-- src/pages/LoginPage.vue -->
<template>
  <q-page class="flex flex-center">
    <q-card class="login-card">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">로그인</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin">
          <q-input
            v-model="loginForm.user_id"
            label="사용자 ID"
            outlined
            dense
            :rules="[val => !!val || '아이디를 입력하세요']"
            class="q-mb-md"
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
            class="q-mb-md"
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
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center">
        <div class="text-caption text-grey-7">
          계정이 없으신가요?
          <router-link @click="register" class="text-primary" to>사용자 생성</router-link>
        </div>
      </q-card-section>
      <q-card-section class="text-center">
        <div class="text-caption text-grey-7">
          계정이 비활성화 상태인가요?
          <router-link @click="activate" class="text-primary" to>계정 활성화</router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>

  <!-- 다이얼로그 -->
  <q-dialog v-model="showDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">사용자 생성</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input v-model="userno" outlined autofocus placeholder="사번을 입력하세요" @keyup.enter="onSubmit" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="취소" color="grey" v-close-popup />
        <q-btn flat label="확인" color="primary" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- 다이얼로그2 -->
  <q-dialog v-model="showDialog2">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">계정 활성화</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input v-model="userno" outlined autofocus placeholder="사번을 입력하세요" />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input v-model="username" outlined autofocus placeholder="이름을 입력하세요" />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input v-model="password" outlined autofocus type="password" placeholder="비밀번호를 입력하세요." />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input v-model="newPassword" outlined autofocus type="password" placeholder="새 비밀번호를 입력하세요." />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="취소" color="grey" v-close-popup />
        <q-btn flat label="확인" color="primary" @click="onSubmit2" />
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { authApi } from "boot/axios.js";
import {userApi} from "src/api/userApi.js";

const router = useRouter();
const $q = useQuasar();


const loginForm = ref({
  user_id: '',
  password: ''
});
const showDialog = ref(false)
const showDialog2 = ref(false)
const loading = ref(false);
const userno = ref()
const username = ref()
const password = ref()
const newPassword = ref()

const register = () => {
  userno.value = null
  showDialog.value = true
}
const activate = () => {
  userno.value = null
  username.value = null
  password.value = null
  newPassword.value = null
  showDialog2.value = true
}

const handleLogin = async () => {
  loading.value = true;

  try {
    const response = await authApi.login(loginForm.value);

    // 토큰 저장
    sessionStorage.setItem('access_token', response.data.access_token);

    // 성공 메시지
    $q.notify({
      type: 'positive',
      message: '로그인 성공!',
      position: 'top'
    });

    // 메인 페이지로 이동
    await router.push(`/hl-chat/${response.data.username}/${loginForm.value.user_id}`);

  } catch (error) {
    console.error('Login error:', error);

    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || '로그인에 실패했습니다',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
}

const onSubmit = async () => {
  try {
    if (userno.value.length <= 0) {
      $q.notify({ type: 'negative',  message: '필수값이 누락됐습니다.',  position: 'top' });
      return
    }
    const request = {
      "user_id":userno.value
    }
    await userApi.saveTempUser(request)
    $q.notify({ type: 'positive',  message: '사용자 생성 성공! \n비밀번호를 바꿔 계정을 활성화해주세요.',  position: 'top' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || '사용자 생성에 실패했습니다',
      position: 'top'
    });
  } finally {
    userno.value = null
    showDialog.value = false
  }
}

const onSubmit2 = async () => {
  try {
    if (userno.value.length <= 0 || username.value.length <= 0 || password.value.length <= 0 || newPassword.value.length <= 0) {
      $q.notify({ type: 'negative',  message: '필수값이 누락됐습니다.',  position: 'top' });
      return
    }

    const request = {
      "user_id":userno.value,
      "user_name": username.value,
      "password": password.value,
      "new_password": newPassword.value
    }
    await userApi.changePassword(request)
    $q.notify({
      type: 'positive',
      message: '계정 활성화 성공!',
      position: 'top'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || '계정 활성화에 실패했습니다',
      position: 'top'
    });
  } finally {
    userno.value = null
    username.value = null
    password.value = null
    newPassword.value = null
    showDialog2.value = false
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
}
</style>
