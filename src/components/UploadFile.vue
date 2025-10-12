<script lang="ts" setup>
import { parseSVCFileToJSON } from '../utils';

const { handleFile, svcConfig, labelText } = defineProps<{ handleFile: (value: any) => void, labelText: string ,svcConfig?: Partial<Papa.ParseLocalConfig<any, File>> }>()



const handleFileChange = async (event: Event) => {
  console.log(event.target)
  if (event.target === null) return
  if (!(event.target instanceof HTMLInputElement)) return
  const target: HTMLInputElement = event.target as HTMLInputElement

  if (!target.files?.length) return

  const data = await parseSVCFileToJSON(target.files[0]!, svcConfig)


  handleFile(data.data)

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
  border: 1px solid black ;
}

.upload-input::file-selector-button:active {
  background-color: black;
}

</style>
