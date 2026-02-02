<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">회원가입</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
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
            v-model="form.password"
            label="비밀번호 *"
            type="password"
            outlined
            dense
            :rules="[
              val => !!val || '비밀번호를 입력하세요',
              val => val.length >= 4 || '비밀번호는 4자 이상이어야 합니다'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-input
            v-model="form.password_confirm"
            label="비밀번호 확인 *"
            type="password"
            outlined
            dense
            :rules="[
              val => !!val || '비밀번호 확인을 입력하세요',
              val => val === form.password || '비밀번호가 일치하지 않습니다'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock_outline" />
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
            <template v-slot:append>
              <q-btn
                flat
                dense
                label="본인인증"
                color="primary"
                disable
                size="sm"
              />
            </template>
          </q-input>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="취소" color="grey" @click="onCancel" />
        <q-btn flat label="가입" color="primary" @click="onSubmit" :loading="loading" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { userApi } from 'src/api/userApi'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const $q = useQuasar()
const loading = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref({
  user_id: '',
  password: '',
  password_confirm: '',
  user_name: '',
  email: '',
  phone: ''
})

watch(dialogVisible, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

const resetForm = () => {
  form.value = {
    user_id: '',
    password: '',
    password_confirm: '',
    user_name: '',
    email: '',
    phone: ''
  }
}

const validateForm = () => {
  if (!form.value.user_id) {
    $q.notify({ type: 'negative', message: '사번을 입력하세요', position: 'top' })
    return false
  }
  if (!form.value.password) {
    $q.notify({ type: 'negative', message: '비밀번호를 입력하세요', position: 'top' })
    return false
  }
  if (form.value.password.length < 4) {
    $q.notify({ type: 'negative', message: '비밀번호는 4자 이상이어야 합니다', position: 'top' })
    return false
  }
  if (form.value.password !== form.value.password_confirm) {
    $q.notify({ type: 'negative', message: '비밀번호가 일치하지 않습니다', position: 'top' })
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

const onSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    const request = {
      user_id: form.value.user_id,
      password: form.value.password,
      user_name: form.value.user_name,
      email: form.value.email || null,
      phone: form.value.phone?.replace(/-/g, '') || null
    }
    await userApi.register(request)
    $q.notify({ type: 'positive', message: '회원가입이 완료되었습니다', position: 'top' })
    emit('success')
    dialogVisible.value = false
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || '회원가입에 실패했습니다',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

const onCancel = () => {
  dialogVisible.value = false
}
</script>
