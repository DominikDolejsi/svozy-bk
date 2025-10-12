<script setup lang="ts">
import { ref, type Ref } from 'vue';
import UploadFile from './components/UploadFile.vue';
import type { Employee, Shift } from './types';

// logic for showing an hiding components
// Here is STATE - which mean the data that we contorll
// I need Employee Data
// I need Shift Data
// I will have Track Data


// With the shift data
// check first line if it contains WEST or EAST only those are important
// take second array and one by one create keyvalues for final data
// then take every other array until there will be Celkem line, skip that
// them repeat
// you will endup with arrays of people that have all the dates with shifts to them
// Then use those two datasets to create final tracks

const handleRawShiftData = (rawShiftData: string[][]) => {
  const westStartLineIndex = rawShiftData.findIndex((line) => {
    if (line.length > 0) {
      return line[0]?.toLowerCase().includes("west")
    }
  })

  const eastStartLineIndex = rawShiftData.findIndex((line) => {
    if (line.length > 0) {
      return line[0]?.toLowerCase().includes("east")
    }
  })

  const shiftData: Shift[] = []

  const eastHeaderLine = rawShiftData[eastStartLineIndex + 1]
  const westHeaderLine = rawShiftData[westStartLineIndex + 1]
  if (!eastHeaderLine?.length) return
  if (!westHeaderLine?.length) return

  for (let index = eastStartLineIndex + 2; index < rawShiftData.length; index++) {
    const element = rawShiftData[index];

    if (!element?.length) return
    if (!(element.length > 0)) return
    if (!element[0]) return

    if (element[0].toLowerCase().includes("celkem")) break

    const shift: Shift = {
      name: element[0],
      shift: "east",
    }

    element.forEach((item, index) => {
      if (!item) return
      if (index === 0) return
      shift[eastHeaderLine[index] ?? "unknownField"] = item
    })

    shiftData.push(shift)

  }

  for (let index = westStartLineIndex + 2; index < rawShiftData.length; index++) {
    const element = rawShiftData[index];

    if (!element?.length) return
    if (!(element.length > 0)) return
    if (!element[0]) return

    if (element[0].toLowerCase().includes("celkem")) break

    const shift: Shift = {
      name: element[0],
      shift: "west",
    }

    element.forEach((item, index) => {
      if (!item) return
      if (index === 0) return
      shift[westHeaderLine[index] ?? "unknownField"] = item
    })

    shiftData.push(shift)

  }

  console.log("ParsedShift", shiftData)




}


// Tracks function will take both data, based on that it woull create groups with same shift
// in those shifts it would based on combination of towns create one or many trips
// THe combination of towns is pivotal !!
// Another shift would get

const employees: Ref<[] | Employee[]> = ref([])
// const shifts: Ref<[] | Shift[]> = ref([])

const employeeConfig: Partial<Papa.ParseLocalConfig<any, File>> = {
  header: true,
  transformHeader: (header, index) => {
    if (index === 0) return "name"
    if (index === 1) return "phone"
    if (index === 2) return "town"
    if (index === 3) return "branch"
    return header
  },
  encoding: "utf-8",
}

const shiftConfig: Partial<Papa.ParseLocalConfig<any, File>> = {
  skipEmptyLines: true,
  encoding: "utf-8",
}

const assignEmployees = (newEmployees: Employee[]) => {
  employees.value = newEmployees
}

const assignShifts = (newShifts: string[][]) => {
  console.log("newShifts", newShifts)
  handleRawShiftData(newShifts)
  // shifts.value = newShifts
}



</script>

<template>
  <UploadFile v-if="true" :handle-file="assignEmployees" label-text="Upload Employee File" :svc-config="employeeConfig" />
  <UploadFile v-if="true" :handle-file="assignShifts" label-text="Upload Shift File" :svc-config="shiftConfig" />
</template>

<style scoped></style>
