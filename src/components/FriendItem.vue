<template>
  <q-item
    clickable
    v-ripple
    @click="$emit('select', user)"
    @contextmenu.prevent="showContextMenu = true"
    role="listitem"
    :aria-label="user.user_name"
  >
    <q-item-section avatar>
      <q-avatar color="teal" text-color="white">
        <img
          v-if="user.avatar"
          :src="user.avatar"
          loading="lazy"
          :alt="`${user.user_name} 프로필`"
        />
        <q-icon v-else name="person" />
      </q-avatar>
    </q-item-section>
    <q-item-section>
      <q-item-label>{{ user.user_name }}</q-item-label>
    </q-item-section>
    <q-item-section side>
      <q-btn
        flat
        round
        dense
        :icon="isFavorite ? 'star' : 'star_border'"
        :color="isFavorite ? 'amber' : 'grey'"
        @click.stop="$emit('toggle-favorite', user.user_id)"
        :aria-label="isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'"
      />
    </q-item-section>

    <!-- Context Menu -->
    <q-menu v-model="showContextMenu" touch-position context-menu>
      <q-list style="min-width: 150px">
        <q-item clickable v-close-popup @click="$emit('select', user)">
          <q-item-section avatar>
            <q-icon name="chat" />
          </q-item-section>
          <q-item-section>대화 시작</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="$emit('toggle-favorite', user.user_id)">
          <q-item-section avatar>
            <q-icon :name="isFavorite ? 'star' : 'star_border'" :color="isFavorite ? 'amber' : 'grey'" />
          </q-item-section>
          <q-item-section>{{ isFavorite ? '즐겨찾기 해제' : '즐겨찾기' }}</q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable v-close-popup @click="$emit('remove', user.user_id)">
          <q-item-section avatar>
            <q-icon name="person_remove" />
          </q-item-section>
          <q-item-section>친구 삭제</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="$emit('block', user.user_id)">
          <q-item-section avatar>
            <q-icon name="block" color="negative" />
          </q-item-section>
          <q-item-section class="text-negative">차단</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-item>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  user: {
    type: Object,
    required: true,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select', 'toggle-favorite', 'remove', 'block'])

const showContextMenu = ref(false)
</script>

<style scoped>
</style>
