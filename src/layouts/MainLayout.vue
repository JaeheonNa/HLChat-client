<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>HL Chat</q-toolbar-title>

        <q-btn
          flat
          round
          icon="settings"
          @click="showProfileDialog = true"
        >
          <q-tooltip>설정</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>

    <ProfileDialog v-model="showProfileDialog" />
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import ProfileDialog from 'src/components/ProfileDialog.vue'

const showProfileDialog = ref(false)
</script>
