<script setup lang="ts">
import { ref, type Ref } from 'vue';
import UploadFile from './components/UploadFile.vue';
import { SHIFT_TIME, TOWN, type Employee, type Shift, type Town } from './types';
import type { ParseResult } from 'papaparse';
import { mapToTown } from './utils';


const error = ref<string>("")


let employees: [] | Employee[] = []
const shiftData: Shift[] = []
const shifts: Ref<[] | Shift[]> = ref([])
let shiftDays: string[] | undefined;

// New DATA STRUCTURE

type JoinedTableData = {
  name: string,
  branch: string,
  town: Town,
  [key: string]: string
}

type WorkShift = {
  day: string,
  time: string,
  workers: string[],
  towns: Town[]
}

let employeeTableData: Employee[] = []
let shiftTableData: Shift[] = []
const joinedTableData: JoinedTableData[] = []
const workShifts: WorkShift[] = []
const rides = ref<Ride[]>([])

const joinTableData = () => {
  shiftTableData.forEach((shift) => {
    const town = employeeTableData.find((employee) => employee.name === shift.name)?.town
    if (!town) return

    const newData: JoinedTableData = {
      ...shift,
      branch: shift.branch.toUpperCase(),
      town: mapToTown(town),
    }

    joinedTableData.push(newData)
  })
  console.log("joined", joinedTableData)
}

const createWorkShift = () => {
  joinedTableData.forEach((item) => {
    const { branch, name, town, ...rest } = item

    if (!rest) return

    Object.keys(rest).forEach((day) => {
      if (!rest[day]) return

      // check if time is morning or afternoon shift
      // if not check if exception acceptible
      // if than handle excpetion with alert
      // otherwise throw away shift
      const isMorningShiftTime = (time: string) => {
        if (time.includes("06:00-15:30")) return true
        return false
      }
      const isAfternoonShiftTime = (time: string) => {
        if (time.includes("15:00-24:00")) return true
        return false
      }

      const isAllowedShiftTime = (time: string, allowedTime: string[] = [SHIFT_TIME.MORNING, SHIFT_TIME.AFTERNOON]) => {
        if (allowedTime.includes(time)) return true
        return false
      }

      if (!isAllowedShiftTime(rest[day])) return


      const workShift = workShifts.find((shift) => shift.day === day && shift.time === rest[day])
      if (workShift) {
        workShift.workers.push(name)

        if (!workShift.towns.includes(town)) {
          workShift.towns.push(town)
        }
        return
      }

      const newWorkShift: WorkShift = {
        day: day,
        time: rest[day],
        workers: [name],
        towns: [town],
      }

      workShifts.push(newWorkShift)
    })
  })

  console.log("WorkShifts", workShifts)
}

type TownConfig = {
  name: Town,
  canConnectTo: Town[],
  dependent?: boolean
}

const townConfig: TownConfig[] = [
  {
    name: "STRAKONICE",
    canConnectTo: ["PÍSEK"]
  },
  {
    name: "PÍSEK",
    canConnectTo: ["MÍROVICE", "STRAKONICE"],
    dependent: false,
  },
  {
    name: "MÍROVICE",
    canConnectTo: ["PŘÍBRAM", "PÍSEK"],
    dependent: true,
  },
  {
    name: "PŘÍBRAM",
    canConnectTo: ["MÍROVICE"]
  },
]

type Ride = {
  day: string,
  track: Track,
  startTime: string,
  endTime: string,
  People: string[],
  notes: string
}

type Track = Town[] & string[]

const createRides = () => {
  workShifts.forEach((workShift) => {
    const tracks = resolveTracks(workShift.towns)
    if (!tracks) return

    tracks.forEach((track) => {
      // handle tracks
      // change start time 

      const peopleInWorkShift = joinedTableData.filter((item) => workShift.workers.includes(item.name))
      const peopleInTrack = peopleInWorkShift.filter((item) => track.includes(item.town))
      const peopleNames = peopleInTrack.map((item) => item.name)
      console.log("peopleInWorkShift", peopleInWorkShift)
      console.log("peopleInTrack", peopleInTrack)
      console.log("peopleNames", peopleNames)

      const peopleBranch = peopleInTrack.map((item) => item.branch)

      peopleBranch.forEach((branch) => {
        if (track.includes(branch)) return
        track.push(branch)
      })

      const Ride: Ride = {
        day: workShift.day,
        startTime: workShift.time,
        endTime: workShift.time,
        People: peopleNames,
        track: track,
        notes: ""
      }
      rides.value.push(Ride)
    })
  })
  console.log("Rides", rides)
}

const resolveTracks = (townPool: Town[]): Track[] | void => {
  const townPoolCopy = [ ...townPool ]
  const tracks: Track[] = []
  if (townPoolCopy.length === 0) return

  if (townPoolCopy.length > townConfig.length) {
    error.value = "Svoz měl duplicitní města"
    return
  }

  const independentTowns = townConfig.filter((town) => town?.dependent !== true)
  const dependentTowns = townConfig.filter((town) => town?.dependent === true)


  dependentTowns.forEach((dependentTown) => {
    const { name, canConnectTo } = dependentTown
    const townIndex = townPoolCopy.indexOf(name)
    const track: Town[] = []
    if (townIndex === -1) return


    const town = townPoolCopy.splice(townIndex)[0]
    track.push(town!)

    for (let index = 0; index < canConnectTo.length; index++) {
      const element = canConnectTo[index];
      if (!element) break

      const connectTownIndex = townPoolCopy.indexOf(element)
      if (connectTownIndex === -1) continue
      const connectTown = townPoolCopy.splice(townIndex)[0]
      track.push(connectTown!)

      break
    }

    console.log("track", track)

    if (tracks.length < 2) return
    tracks.push(track)
  })

  independentTowns.forEach((independentTown) => {
    const { name, canConnectTo } = independentTown
    const townIndex = townPoolCopy.indexOf(name)
    const track: Town[] = []
    if (townIndex === -1) return

    const town = townPoolCopy.splice(townIndex)[0]
    track.push(town!)

    for (let index = 0; index < canConnectTo.length; index++) {
      const element = canConnectTo[index];
      if (!element) break

      const connectTownIndex = townPoolCopy.indexOf(element)
      if (connectTownIndex === -1) continue
      const connectTown = townPoolCopy.splice(townIndex)[0]
      track.push(connectTown!)

      break
    }
    tracks.push(track)
  })

  return tracks
}

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

  const eastHeaderLine = rawShiftData[eastStartLineIndex + 1]
  const westHeaderLine = rawShiftData[westStartLineIndex + 1]

  shiftDays = eastHeaderLine?.slice(1)

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
      branch: "east",
    }


    element.forEach((item, index) => {
      if (!item) return
      if (index === 0) return
      shift[eastHeaderLine[index] ?? "unknownField"] = item?.slice(0, 11)
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
      branch: "west",
    }

    element.forEach((item, index) => {
      if (!item) return
      if (index === 0) return
      shift[westHeaderLine[index] ?? "unknownField"] = item?.slice(0, 11)
    })

    shiftData.push(shift)

  }

  shiftTableData = shiftData

  console.log("ParsedShift", shiftData)
}




// Tracks function will take both data, based on that it woull create groups with same shift
// in those shifts it would based on combination of towns create one or many trips
// THe combination of towns is pivotal !!
// Another shift would get

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

const assignEmployees = (newEmployees: ParseResult<any>) => {
  employees = newEmployees.data
  employeeTableData = newEmployees.data
  console.log("newEmployees", employees)
}

const assignShifts = (newShifts: ParseResult<any>) => {
  console.log("newShifts", newShifts)
  handleRawShiftData(newShifts.data)
  // shifts.value = newShifts
}

const handleError = (err: string) => {
  error.value = err
}
</script>

<template>
  <UploadFile v-if="true" @data-loaded="assignEmployees" @error="handleError" label-text="Upload Employee File"
    :scv-config="employeeConfig" />
  <UploadFile v-if="true" @data-loaded="assignShifts" @error="handleError" label-text="Upload Shift File"
    :scv-config="shiftConfig" />
  <!-- <button @click="createRides">Calculate</button> -->
  <button @click="joinTableData">Join</button>
  <button @click="createWorkShift">Create Work Shifts</button>
  <button @click="createRides">Create RIdes</button>
  <div>{{ error }}</div>
  <div v-for="(ride, index) in rides">
    {{ "Svoz " + (index + 1) }} - {{ ride.day }} - {{ ride.startTime }} - {{ ride.track.join("->") }} - {{ "celkem lidí " + ride.People.length }}
    <div v-for="value in ride.People">{{ value }}</div>
  </div>
</template>

<style scoped></style>
