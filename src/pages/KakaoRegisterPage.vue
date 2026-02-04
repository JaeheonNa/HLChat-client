<template>
  <q-page class="register-page flex flex-center">
    <q-card class="register-card" flat>
      <q-card-section class="text-center q-pt-lg">
        <img
          src="~assets/hl-holdings-logo.png"
          alt="HL Holdings"
          class="logo"
        />
        <div class="text-h6 q-mt-md">카카오 간편가입</div>
        <div class="text-caption text-grey-7 q-mt-xs">
          추가 정보를 입력하여 가입을 완료해주세요
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div v-if="kakaoInfo.profile_image" class="text-center q-mb-md">
          <q-avatar size="80px">
            <img :src="kakaoInfo.profile_image" alt="프로필" />
          </q-avatar>
        </div>

        <q-form @submit.prevent="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.user_id"
            label="사번 *"
            outlined
            dense
            :rules="[val => !!val || '사번을 입력하세요']"
            @update:model-value="val => form.user_id = val?.toUpperCase()"
          >
            <template v-slot:prepend>
              <q-icon name="badge" />
            </template>
          </q-input>

          <q-input
            v-model="form.user_name"
            label="이름 *"
            outlined
            dense
            :rules="[val => !!val || '이름을 입력하세요']"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="form.email"
            label="이메일"
            type="email"
            outlined
            dense
            :rules="[
              val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || '올바른 이메일 형식을 입력하세요'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="form.phone"
            label="전화번호"
            outlined
            dense
            mask="###-####-####"
          >
            <template v-slot:prepend>
              <q-icon name="phone" />
            </template>
          </q-input>

          <q-btn
            type="submit"
            color="primary"
            label="가입 완료"
            class="full-width q-mt-lg"
            size="lg"
            :loading="loading"
          />

          <q-btn
            flat
            color="grey"
            label="취소"
            class="full-width"
            @click="onCancel"
          />
        </q-form>
      </q-card-section>
    </q-card>
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

const loading = ref(false)

const kakaoInfo = ref({
  provider: 'KAKAO',
  provider_id: '',
  nickname: '',
  email: '',
  profile_image: ''
})

const form = ref({
  user_id: '',
  user_name: '',
  email: '',
  phone: ''
})

onMounted(() => {
  const { provider, provider_id, nickname, email, profile_image } = route.query

  if (!provider_id) {
    $q.notify({
      type: 'negative',
      message: '잘못된 접근입니다',
      position: 'top'
    })
    router.replace('/hl-chat/log-in')
    return
  }

  kakaoInfo.value = {
    provider: provider || 'KAKAO',
    provider_id,
    nickname: nickname || '',
    email: email || '',
    profile_image: profile_image || ''
  }

  form.value.user_name = nickname || ''
  form.value.email = email || ''
})

const validateForm = () => {
  if (!form.value.user_id) {
    $q.notify({ type: 'negative', message: '사번을 입력하세요', position: 'top' })
    return false
  }
  if (!form.value.user_name) {
    $q.notify({ type: 'negative', message: '이름을 입력하세요', position: 'top' })
    return false
  }
  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    $q.notify({ type: 'negative', message: '올바른 이메일 형식을 입력하세요', position: 'top' })
    return false
  }
  return true
}

const checkAndSubmit = async () => {
  const phone = form.value.phone?.replace(/-/g, '') || ''

  if (form.value.user_name && phone) {
    try {
      const checkResponse = await userApi.kakaoCheckExisting({
        user_name: form.value.user_name,
        phone: phone,
        provider_id: kakaoInfo.value.provider_id
      })

      if (checkResponse.data?.existing_user_id) {
        $q.dialog({
          title: '기존 계정 발견',
          message: `기존 계정이 존재합니다. (${checkResponse.data.existing_user_name})\n카카오 연동 하시겠습니까?`,
          cancel: {
            label: '아니오',
            color: 'grey'
          },
          ok: {
            label: '예',
            color: 'primary'
          },
          persistent: true
        }).onOk(async () => {
          await linkExistingAccount(checkResponse.data.existing_user_id)
        })
        return
      }
    } catch (error) {
      console.error('Check existing error:', error)
    }
  }

  await registerNewUser()
}

const linkExistingAccount = async (existingUserId) => {
  loading.value = true
  try {
    const response = await userApi.kakaoLink({
      user_id: existingUserId,
      provider: kakaoInfo.value.provider,
      provider_id: kakaoInfo.value.provider_id
    })

    sessionStorage.setItem('access_token', response.data.access_token)
    sessionStorage.setItem('user_id', existingUserId)
    sessionStorage.setItem('username', response.data.username)

    $q.notify({
      type: 'positive',
      message: '카카오 계정이 연동되었습니다!',
      position: 'top'
    })

    await router.replace(`/hl-chat/${response.data.username}/${existingUserId}`)
  } catch (error) {
    console.error('Kakao link error:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || '연동에 실패했습니다',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

const registerNewUser = async () => {
  loading.value = true
  try {
    const request = {
      provider: kakaoInfo.value.provider,
      provider_id: kakaoInfo.value.provider_id,
      user_id: form.value.user_id,
      user_name: form.value.user_name,
      email: form.value.email || null,
      phone: form.value.phone?.replace(/-/g, '') || null,
      profile_image: kakaoInfo.value.profile_image || null
    }

    const response = await userApi.kakaoRegister(request)

    sessionStorage.setItem('access_token', response.data.access_token)
    sessionStorage.setItem('user_id', form.value.user_id)
    sessionStorage.setItem('username', form.value.user_name)

    $q.notify({
      type: 'positive',
      message: '가입이 완료되었습니다!',
      position: 'top'
    })

    await router.replace(`/hl-chat/${form.value.user_name}/${form.value.user_id}`)
  } catch (error) {
    console.error('Kakao register error:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || '가입에 실패했습니다',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

const onSubmit = async () => {
  if (!validateForm()) return
  await checkAndSubmit()
}

const onCancel = () => {
  router.replace('/hl-chat/log-in')
}
</script>

<style scoped>
.register-page {
  background-color: #ffffff;
  min-height: 100vh;
}

.register-card {
  width: 100%;
  max-width: 400px;
  background-color: #ffffff;
}

.logo {
  max-width: 160px;
  height: auto;
}
</style>
