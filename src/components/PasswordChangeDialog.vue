<template>
  <q-dialog v-model="dialogVisible" :persistent="forced">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">
          {{ forced ? '비밀번호 변경 필요' : '비밀번호 변경' }}
        </div>
        <div v-if="forced" class="text-caption text-grey-7 q-mt-sm">
          비밀번호 변경 후 90일이 경과했습니다. 보안을 위해 비밀번호를 변경해주세요.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form @submit.prevent="onSubmit" class="q-gutter-md">
          <q-input
            v-if="!forced"
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
            v-model="form.current_password"
            label="현재 비밀번호 *"
            type="password"
            outlined
            dense
            :rules="[val => !!val || '현재 비밀번호를 입력하세요']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-input
            v-model="form.new_password"
            label="새 비밀번호 *"
            type="password"
            outlined
            dense
            :rules="[
              val => !!val || '새 비밀번호를 입력하세요',
              val => val.length >= 4 || '비밀번호는 4자 이상이어야 합니다',
              val => val !== form.current_password || '현재 비밀번호와 다른 비밀번호를 입력하세요'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock_outline" />
            </template>
          </q-input>

          <q-input
            v-model="form.new_password_confirm"
            label="새 비밀번호 확인 *"
            type="password"
            outlined
            dense
            :rules="[
              val => !!val || '새 비밀번호 확인을 입력하세요',
              val => val === form.new_password || '새 비밀번호가 일치하지 않습니다'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock_outline" />
            </template>
          </q-input>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="!forced"
          flat
          label="취소"
          color="grey"
          @click="onCancel"
        />
        <q-btn
          flat
          label="변경"
          color="primary"
          @click="onSubmit"
          :loading="loading"
        />
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
  },
  forced: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    default: ''
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
  current_password: '',
  new_password: '',
  new_password_confirm: ''
})

watch(dialogVisible, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

watch(() => props.userId, (newVal) => {
  if (newVal) {
    form.value.user_id = newVal
  }
})

const resetForm = () => {
  form.value = {
    user_id: props.userId || '',
    current_password: '',
    new_password: '',
    new_password_confirm: ''
  }
}

const validateForm = () => {
  if (!props.forced && !form.value.user_id) {
    $q.notify({ type: 'negative', message: '사번을 입력하세요', position: 'top' })
    return false
  }
  if (!form.value.current_password) {
    $q.notify({ type: 'negative', message: '현재 비밀번호를 입력하세요', position: 'top' })
    return false
  }
  if (!form.value.new_password) {
    $q.notify({ type: 'negative', message: '새 비밀번호를 입력하세요', position: 'top' })
    return false
  }
  if (form.value.new_password.length < 4) {
    $q.notify({ type: 'negative', message: '비밀번호는 4자 이상이어야 합니다', position: 'top' })
    return false
  }
  if (form.value.new_password === form.value.current_password) {
    $q.notify({ type: 'negative', message: '현재 비밀번호와 다른 비밀번호를 입력하세요', position: 'top' })
    return false
  }
  if (form.value.new_password !== form.value.new_password_confirm) {
    $q.notify({ type: 'negative', message: '새 비밀번호가 일치하지 않습니다', position: 'top' })
    return false
  }
  return true
}

const onSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    const request = {
      user_id: props.forced ? props.userId : form.value.user_id,
      password: form.value.current_password,
      new_password: form.value.new_password
    }
    await userApi.changePassword(request)
    $q.notify({ type: 'positive', message: '비밀번호가 변경되었습니다', position: 'top' })
    emit('success')
    dialogVisible.value = false
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || '비밀번호 변경에 실패했습니다',
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
