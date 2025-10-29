<script setup lang="ts">
import { ref } from "vue";
import UploadFile from "./components/UploadFile.vue";
import {
    EMPLOYEE_TABLE_HEADERS,
    TABLE_IDENTIFICATORS,
    type Employee,
    type JoinedTableEmployee,
    type Shift,
    type ShiftEmployee,
    type Town,
    type RawRide
} from "./types";
import type { ParseResult } from "papaparse";
import {
    filterEmptyEmployees,
    findBranchIndexes,
    getBranchName,
    isAllowedShiftTime,
    joinTableData,
    parseWhatsAppValue,
    createRawRides,
} from "./utils";

const error = ref<string>("");

// New DATA STRUCTURE

let employeeTableData: Employee[] = [];
let rawShiftTableData: string[][] = [];
let shiftEmployeeData: ShiftEmployee[] = [];
let joinedTableData: JoinedTableEmployee[] = [];
let rawRideData: RawRide[] = []
const rides = ref<Ride[]>([]);

// const parseJoinedData = (joinedData: JoinedTableEmployee[]) => {};

type TownConfig = {
    name: Town;
    canConnectTo: Town[];
    dependent?: boolean;
};

const townConfig: TownConfig[] = [
    {
        name: "STRAKONICE",
        canConnectTo: ["PÍSEK"],
    },
    {
        name: "PÍSEK",
        canConnectTo: ["MIROVICE", "STRAKONICE"],
        dependent: false,
    },
    {
        name: "MIROVICE",
        canConnectTo: ["PŘÍBRAM", "PÍSEK"],
        dependent: true,
    },
    {
        name: "PŘÍBRAM",
        canConnectTo: ["MIROVICE"],
    },
];

type Ride = {
    day: string;
    track: Track;
    startTime: string;
    endTime: string;
    people: JoinedTableEmployee[];
    notes: string;
};

type Track = Town[] & string[];

const createRides = () => {
  rawRideData.forEach((rawRide) => {
    console.log("rawRide",rawRide)
    const tracks = resolveTracks(rawRide.towns)

    if (!tracks) return

    tracks.forEach((track: Town[]) => {
      const people = rawRide.people.filter((employee: JoinedTableEmployee) => track.includes(employee.town.toUpperCase() as Town))

      const ride: Ride = {
        day: rawRide.day,
        startTime: rawRide.time,
        endTime: rawRide.time,
        people: people,
        track: track,
        notes: ""
      }

      console.log("ride", ride)

      rides.value.push(ride)
    })

  })
};

const resolveTracks = (townPool: Town[]): Track[] | void => {
    const townPoolCopy = [...townPool];
    const tracks: Track[] = [];

    if (townPoolCopy.length === 0) return;

    if (townPoolCopy.length > townConfig.length) {
        error.value = "Svoz měl duplicitní města";
        return;
    }

    const independentTowns = townConfig.filter(
        (town) => town?.dependent !== true,
    );
    const dependentTowns = townConfig.filter(
        (town) => town?.dependent === true,
    );

    dependentTowns.forEach((dependentTown) => {
        const { name, canConnectTo } = dependentTown;
        const townIndex = townPoolCopy.indexOf(name);
        const track: Town[] = [];
        if (townIndex === -1) return;

        const town = townPoolCopy.splice(townIndex, 1)[0];
        track.push(town!);

        for (let index = 0; index < canConnectTo.length; index++) {
            const element = canConnectTo[index];
            if (!element) break;

            const connectTownIndex = townPoolCopy.indexOf(element);
            if (connectTownIndex === -1) continue;
            const connectTown = townPoolCopy.splice(connectTownIndex, 1)[0];
            track.push(connectTown!);

            break;
        }

        if (track.length < 2) return;

        tracks.push(track);
    });

    independentTowns.forEach((independentTown) => {
        const { name, canConnectTo } = independentTown;
        const townIndex = townPoolCopy.indexOf(name);
        const track: Town[] = [];
        if (townIndex === -1) return;

        const town = townPoolCopy.splice(townIndex, 1)[0];
        track.push(town!);

        for (let index = 0; index < canConnectTo.length; index++) {
            const element = canConnectTo[index];
            if (!element) break;

            const connectTownIndex = townPoolCopy.indexOf(element);
            if (connectTownIndex === -1) continue;
            const connectTown = townPoolCopy.splice(connectTownIndex, 1)[0];
            track.push(connectTown!);

            break;
        }
        tracks.push(track);
    });

    return tracks;
};

const parseRawShiftTableData = (rawShiftTableData: string[][]) => {
    const branchIndexes = findBranchIndexes(
        rawShiftTableData,
        TABLE_IDENTIFICATORS.BRANCH_LINE,
    );

    // function splitTableToBranches
    const branchShifts: string[][][] = [];
    branchIndexes.forEach((branchIndex, index) => {
        const branchShift = rawShiftTableData.slice(
            branchIndex,
            branchIndexes[index + 1],
        );
        const deepCopy = structuredClone(branchShift);

        branchShifts.push(deepCopy);
    });

    const shiftEmployees: ShiftEmployee[] = [];

    branchShifts.forEach((branchShift) => {
        const branchName = getBranchName(branchShift?.[0]?.[0] ?? "");
        const branchShiftHeader = branchShift.find((line) =>
            line.includes("jméno"),
        );

        // handle error branchName null
        if (!branchName) return;

        // Handle errro branch header undefined
        if (!branchShiftHeader || branchShiftHeader.length < 1) return;

        branchShift.forEach((line, _lineIndex) => {
            // ignore header and last line and branch denominator
            const firstCell = line[0];

            const linesToIgnore = [
                TABLE_IDENTIFICATORS.BRANCH_END,
                TABLE_IDENTIFICATORS.BRANCH_HEADER,
                TABLE_IDENTIFICATORS.BRANCH_IGNORE,
                TABLE_IDENTIFICATORS.BRANCH_LINE,
            ];

            const hasIgnoreValue = linesToIgnore.some((ignoreValue) =>
                firstCell?.includes(ignoreValue),
            );

            if (hasIgnoreValue) return;

            const shiftEmployee: Partial<ShiftEmployee> = {
                name: undefined,
                shiftBranch: undefined,
                shifts: [],
            };

            shiftEmployee.shiftBranch = branchName;

            line.forEach((cell, cellIndex) => {
                const cellHeader = branchShiftHeader[cellIndex];
                // handle cellHeader undefined
                if (!cellHeader) return;

                if (cellHeader === "jméno") {
                    shiftEmployee.name = cell;
                    return;
                }

                // here I should parse the time
                const parsedTimeCell = cell.slice(0, 11);
                if (parsedTimeCell && !isAllowedShiftTime(parsedTimeCell))
                    return;

                const shift: Shift = {
                    day: cellHeader,
                    time: parsedTimeCell,
                };
                shiftEmployee.shifts?.push(shift);
            });

            // validate employee
            if (
                !shiftEmployee.name ||
                !shiftEmployee.shiftBranch ||
                !shiftEmployee.shifts
            )
                return;

            // if has no defined shift
            if (shiftEmployee.shifts.every((shift) => !shift.time)) return;

            const validatedEmployee: ShiftEmployee = {
                name: shiftEmployee.name,
                shiftBranch: shiftEmployee.shiftBranch,
                shifts: shiftEmployee.shifts,
            };

            shiftEmployees.push(validatedEmployee);
        });
    });
    return shiftEmployees;
};

// Tracks function will take both data, based on that it woull create groups with same shift
// in those shifts it would based on combination of towns create one or many trips
// THe combination of towns is pivotal !!
// Another shift would get

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
    employeeTableData = filterEmptyEmployees(newEmployees.data);
};

const assignShifts = (newShifts: ParseResult<any>) => {
    rawShiftTableData = newShifts.data;
    shiftEmployeeData = parseRawShiftTableData(newShifts.data);
};

const handleError = (err: string) => {
    error.value = err;
};

const handleJoin = () => {
    joinedTableData = joinTableData(shiftEmployeeData, employeeTableData);
};

const handleRawRides = () => {
  rawRideData = createRawRides(joinedTableData)
}

const logIt = () => {
    const data: Record<string, any> = {
        employeeTableData: employeeTableData,
        rawShiftTableData: rawShiftTableData,
        shiftEmployeeData: shiftEmployeeData,
        joinedTableData: joinedTableData,
        rawRideData: rawRideData,
    };

    Object.keys(data).forEach((key) => console.log(`${key}`, data[key]));
};
</script>

<template>
    <UploadFile
        v-if="true"
        @data-loaded="assignEmployees"
        @error="handleError"
        label-text="Upload Employee File"
        :scv-config="employeeConfig"
    />
    <UploadFile
        v-if="true"
        @data-loaded="assignShifts"
        @error="handleError"
        label-text="Upload Shift File"
        :scv-config="shiftConfig"
    />
    <!-- <button @click="createRides">Calculate</button> -->
    <button @click="handleJoin">Join</button>
    <button @click="handleRawRides">Create Raw Rides</button>
    <button @click="createRides">Create Rides</button>
    <button @click="logIt">Log It</button>
    <div>{{ error }}</div>
    <div v-for="(ride, index) in rides">
        {{ "Svoz " + (index + 1) }} - {{ ride.day }} - {{ ride.startTime }} -
        {{ ride.track.join("->") }} - {{ "celkem lidí " + ride.people.length }}
        <div v-for="value in ride.people">{{ value }}</div>
    </div>
</template>

<style scoped></style>
