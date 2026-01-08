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
          <router-link to="/register" class="text-primary">회원가입</router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { authApi } from "boot/axios.js";

const router = useRouter();
const $q = useQuasar();

const loginForm = ref({
  user_id: '',
  password: ''
});

const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;

  try {
    const response = await authApi.login(loginForm.value);

    // 토큰 저장
    sessionStorage.setItem('access_token', response.data.access_token);
    // if (response.data.refresh_token) {
    //   sessionStorage.setItem('refresh_token', response.data.refresh_token);
    // }

    // 성공 메시지
    $q.notify({
      type: 'positive',
      message: '로그인 성공!',
      position: 'top'
    });

    // 메인 페이지로 이동
    await router.push('/');

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
};
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
}
</style>
