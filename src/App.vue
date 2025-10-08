<script setup lang="ts">
import { ref, type Ref } from 'vue';
import UploadFile from './components/UploadFile.vue';
import type { Employee, ShiftFile } from './types';

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

// Tracks function will take both data, based on that it woull create groups with same shift
// in those shifts it would based on combination of towns create one or many trips
// THe combination of towns is pivotal !!
// Another shift would get

const employees: Ref<[] | Employee[]> = ref([])
const shifts: Ref<[] | ShiftFile[]> = ref([])

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

const assignShifts = (newShifts: Employee[]) => {
  shifts.value = newShifts
}



</script>

<template>
  <UploadFile v-if="true" :handle-file="assignEmployees" :svc-config="employeeConfig"/>
  <UploadFile v-if="false" :handle-file="assignShifts" :svc-config="shiftConfig"/>
</template>

<style scoped></style>
