<template>
  <q-list separator>
    <q-item v-for="n in count" :key="n">
      <q-item-section avatar>
        <q-skeleton type="QAvatar" />
      </q-item-section>
      <q-item-section>
        <q-item-label>
          <q-skeleton type="text" :width="primaryWidth" />
        </q-item-label>
        <q-item-label caption>
          <q-skeleton type="text" :width="secondaryWidth" />
        </q-item-label>
      </q-item-section>
      <q-item-section v-if="showSide" side>
        <q-skeleton type="text" width="50px" />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 5,
  },
  primaryWidth: {
    type: String,
    default: '40%',
  },
  secondaryWidth: {
    type: String,
    default: '70%',
  },
  showSide: {
    type: Boolean,
    default: true,
  },
})
</script>
