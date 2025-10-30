<script setup lang="ts">
import { ref } from "vue";
import UploadFile from "./components/UploadFile.vue";
import RidesTable from "./components/RidesTable.vue"
import {
    EMPLOYEE_TABLE_HEADERS,
    type Employee,
    type JoinedTableEmployee,
    type ShiftEmployee,
    type RawShiftRide,
    type ShiftRide
} from "./types";
import type { ParseResult } from "papaparse";
import {
    filterEmptyEmployees,
    joinTableData,
    parseWhatsAppValue,
    createRawShiftRides,
    parseRawRide,
    parseRawShiftTableData,
} from "./utils";

const error = ref<string>("");

// New DATA STRUCTURE

const employeeTableData = ref<Employee[]>([]);
const rawShiftTableData = ref<string[][] >([]);
let shiftEmployeeData: ShiftEmployee[] = [];
let joinedTableData: JoinedTableEmployee[] = [];
let rawShiftRideData: RawShiftRide[] = []
const shiftRides = ref<ShiftRide[]>([]);

// const parseJoinedData = (joinedData: JoinedTableEmployee[]) => {};


const createRides = (rawShiftRideData: RawShiftRide[]): ShiftRide[] => {
    const shiftRides: ShiftRide[] = []
    rawShiftRideData.forEach((rawShiftRide) => {

        const shiftRide: ShiftRide = {
            day: rawShiftRide.day,
            morning: parseRawRide(rawShiftRide.morning, "MORNING"),
            afternoon: parseRawRide(rawShiftRide.afternoon, "AFTERNOON"),
        }

        shiftRides.push(shiftRide)
    })

    return shiftRides
};


const employeeConfig: Partial<Papa.ParseLocalConfig<any, File>> = {
    header: true,
    transformHeader: (header, _index) => {
        const normalizedHeader = header.toLowerCase().trim();

        if (normalizedHeader === EMPLOYEE_TABLE_HEADERS.BRANCH) return "branch";
        if (normalizedHeader === EMPLOYEE_TABLE_HEADERS.NAME) return "name";
        if (normalizedHeader === EMPLOYEE_TABLE_HEADERS.PHONE) return "phone";
        if (normalizedHeader === EMPLOYEE_TABLE_HEADERS.TOWN) return "town";
        if (normalizedHeader === EMPLOYEE_TABLE_HEADERS.WHATSAPP)
            return "whatsapp";

        return header;
    },
    transform: (value, header) => {
        const normalized = value.trim().toLowerCase();

        if (header === "whatsapp") {
            return parseWhatsAppValue(normalized);
        }

        if (normalized) return normalized;
        return value;
    },
    encoding: "utf-8",
};

const shiftConfig: Partial<Papa.ParseLocalConfig<any, File>> = {
    skipEmptyLines: true,
    encoding: "utf-8",
    transform: (value) => {
        const normalize = value.trim().toLowerCase();

        if (normalize) return normalize;
        return value;
    },
};

const assignEmployees = (newEmployees: ParseResult<any>) => {
    employeeTableData.value = filterEmptyEmployees(newEmployees.data);
};

const assignShifts = (newShifts: ParseResult<any>) => {
    rawShiftTableData.value = newShifts.data;
    shiftEmployeeData = parseRawShiftTableData(newShifts.data);
};

const handleError = (err: string) => {
    error.value = err;
};

const calculateRides = () => {
    joinedTableData = joinTableData(shiftEmployeeData, employeeTableData.value);
    rawShiftRideData = createRawShiftRides(joinedTableData)
    shiftRides.value = createRides(rawShiftRideData)
}

const logIt = () => {
    const data: Record<string, any> = {
        employeeTableData: employeeTableData.value,
        rawShiftTableData: rawShiftTableData.value,
        shiftEmployeeData: shiftEmployeeData,
        joinedTableData: joinedTableData,
        rawShiftRideData: rawShiftRideData,
    };

    Object.keys(data).forEach((key) => console.log(`${key}`, data[key]));
};
</script>

<template>
    <button @click="logIt">Log It</button>
    <UploadFile v-if="employeeTableData.length === 0" @data-loaded="assignEmployees" @error="handleError" label-text="Nahraj tabulku se zaměstnaci"
        :scv-config="employeeConfig" />
    <UploadFile v-if="employeeTableData.length !== 0 && rawShiftTableData.length === 0" @data-loaded="assignShifts" @error="handleError" label-text="Nahraj tabulku se směnami"
        :scv-config="shiftConfig" />
    <!-- <button @click="createRides">Calculate</button> -->
    <button @click="calculateRides">Vypočítej svozy</button>
    <div>{{ error }}</div>
    <RidesTable v-if="shiftRides" :shift-rides="shiftRides"/>
</template>

<style scoped></style>
