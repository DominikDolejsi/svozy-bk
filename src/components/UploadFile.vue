<script lang="ts" setup>
import type { ParseResult } from 'papaparse';
import { parseSVCFileToJSON } from '../utils';
import { ref } from 'vue';

const { scvConfig, labelText } = defineProps<{ labelText: string, scvConfig?: Partial<Papa.ParseLocalConfig<any, File>> }>()

const emit = defineEmits<{
  (e: "data-loaded", data: ParseResult<any>): void
  (e: "error", error: string): void
}>()

const error = ref<string>("")
const loading = ref<boolean>(false)

const handleFileChange = async (event: Event) => {
  // type guards
  if (event.target === null) return
  if (!(event.target instanceof HTMLInputElement)) return

  // accessing file in input
  const target: HTMLInputElement = event.target as HTMLInputElement
  if (!target.files?.length) return
  const file = target.files?.[0]
  if (!file) return

  if (!file.name.endsWith('.csv')) {
    error.value = 'Please select a CSV file';
    emit('error', error.value);
    return;
  }

  error.value = ""
  loading.value = true

  try {
    const data = await parseSVCFileToJSON(file, scvConfig)
    emit("data-loaded", data)
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Error reading file"
    emit("error", error.value)
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div class="container">
    <label class="upload-label">{{ labelText }}</label>
    <input class="upload-input" type="file" @change="handleFileChange" accept="text/csv">
  </div>
</template>

<style lang="postcss" scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 0.6em;
  margin: 1em;
}

.upload-input {
  background-color: transparent;
  width: 400px;
  padding-inline: 2px;
  padding-block: 2px;
  border-radius: 100px;
  cursor: pointer;
}

.upload-input::file-selector-button {
  background-color: #3b3b3b;
  border-radius: 100px;
  width: 100px;
  height: 100px;
  content: "Upload File";
  cursor: pointer;
  border: 1px solid black;
}

.upload-input::file-selector-button:active {
  background-color: black;
}
</style>
