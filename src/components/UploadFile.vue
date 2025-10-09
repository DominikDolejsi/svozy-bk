<script lang="ts" setup>
import { parseSVCFileToJSON } from '../utils';

const { handleFile, svcConfig } = defineProps<{ handleFile: (value: any) => void, svcConfig?: Partial<Papa.ParseLocalConfig<any, File>> }>()



const handleFileChange = async (event: Event) => {
  console.log(event.target)
  if (event.target === null) return
  if (!(event.target instanceof HTMLInputElement)) return
  const target: HTMLInputElement = event.target as HTMLInputElement

  if (!target.files?.length) return

  const data = await parseSVCFileToJSON(target.files[0]!, svcConfig)


  console.log("Finished")
  console.log(data)
  handleFile(data.data)

}

</script>

<template>
  <input type="file" @change="handleFileChange" accept="text/csv">
</template>

<style lang="postcss" scoped></style>
