import Papa, { type ParseResult } from "papaparse";
import {
  type Branch,
  type Employee,
  type JoinedTableEmployee,
  type RawRide,
  type RawShiftRide,
  type Ride,
  type Shift,
  SHIFT_TIME,
  type ShiftEmployee,
  type ShiftTime,
  TABLE_IDENTIFICATORS,
  TOWN,
  type Town,
  townConfig,
  type Track,
} from "./types.ts";

export const parseSVCFileToJSON = <T>(
  file: File,
  config?: Partial<Papa.ParseLocalConfig<T, File>>,
): Promise<ParseResult<T>> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      ...config,
      skipEmptyLines: "greedy",
      complete: (results: ParseResult<T>) => {
        console.log("Papa results", results);
        resolve(results);
      },
      error: (error: unknown) => {
        reject(error);
      },
    });
  });
};

export function mapToTown(value: string): Town {
  const normalized = value.toUpperCase() as Town;

  // Validate it's actually a valid town
  if (!(normalized in TOWN)) {
    // throw new Error(`Invalid town: ${value}`);
    console.error(`Invalid town: ${value}`);
  }

  return normalized;
}

export const parseWhatsAppValue = (value: string): boolean => {
  const firstThreeLetters = value.slice(0, 2);
  if (firstThreeLetters === "ano") return true;
  return false;
};

export const isAllowedShiftTime = (
  time: string,
  allowedTime: string[] = [SHIFT_TIME.MORNING, SHIFT_TIME.AFTERNOON],
) => {
  if (allowedTime.includes(time)) return true;
  return false;
};

export const filterEmptyEmployees = (employees: any[]): Employee[] => {
  const filteredEmployees = employees.filter((employee) => {
    const requiredFields = [];
    const emptyValues = [undefined, null, ""];

    requiredFields.push(employee["branch"]);
    requiredFields.push(employee["town"]);
    requiredFields.push(employee["name"]);

    const hasAnyFieldEmpty = requiredFields.some((value) =>
      emptyValues.includes(value)
    );

    if (hasAnyFieldEmpty) return false;
    return true;
  });

  return filteredEmployees;
};

export const findBranchIndexes = (
  table: string[][],
  _indexIdentificator: string,
): number[] => {
  const branchIndexes: number[] = [];
  table.forEach((line, index) => {
    const firstCell = line[0];
    if (firstCell?.includes(TABLE_IDENTIFICATORS.BRANCH_LINE)) {
      branchIndexes.push(index);
    }
  });
  return branchIndexes;
};

export const getBranchName = (branchName: string): Branch | null => {
  if (branchName.includes("east")) return "EAST";
  if (branchName.includes("west")) return "WEST";
  if (branchName.includes("dt")) return "DT";
  return null;
};

export const joinTableData = (
  shiftEmployeeData: ShiftEmployee[],
  employeeTableData: Employee[],
) => {
  const joinedTableData: JoinedTableEmployee[] = [];
  shiftEmployeeData.forEach((shiftEmployee) => {
    const { name, shiftBranch, shifts } = shiftEmployee;
    const employee = employeeTableData.find((employee) =>
      employee.name === shiftEmployee.name
    );

    // handel error emplyoee wasnt found in emplyoee table
    if (!employee) return;

    const joinedEmployee: JoinedTableEmployee = {
      name,
      shiftBranch,
      shifts,
      town: employee?.town,
      originBranch: employee.branch,
    };

    joinedTableData.push(joinedEmployee);
  });

  return joinedTableData;
};

export const createRawShiftRides = (
  joinedTableData: JoinedTableEmployee[],
): RawShiftRide[] => {
  const shiftDays: string[] = [];
  joinedTableData[0]?.shifts.forEach((shift) => shiftDays.push(shift.day));

  const rawShiftRides: RawShiftRide[] = [];

  shiftDays.forEach((shiftDay) => {
    const morningPeople: JoinedTableEmployee[] = [];
    const morningTowns: Town[] = [];
    const afternoonPeople: JoinedTableEmployee[] = [];
    const afternoonTowns: Town[] = [];

    joinedTableData.forEach((employee) => {
      const correspondingShift = employee.shifts.find((shift) =>
        shift.day === shiftDay && shift.time
      );
      const parsedTown = employee.town.toUpperCase() as Town;

      if (!correspondingShift) return;

      if (correspondingShift.time === SHIFT_TIME.MORNING) {
        morningPeople.push(employee);
        if (!morningTowns.includes(parsedTown)) {
          morningTowns.push(parsedTown);
        }
      } else {
        afternoonPeople.push(employee);
        if (!afternoonTowns.includes(parsedTown)) {
          afternoonTowns.push(parsedTown);
        }
      }
    });

    const rawShiftRide: RawShiftRide = {
      day: shiftDay,
      morning: { people: morningPeople, towns: morningTowns },
      afternoon: { people: afternoonPeople, towns: afternoonTowns },
    };

    rawShiftRides.push(rawShiftRide);
  });

  return rawShiftRides;
};

export const resolveTracks = (townPool: Town[]): Track[] | void => {
  const townPoolCopy = [...townPool];
  const tracks: Track[] = [];

  if (townPoolCopy.length === 0) return;

  if (townPoolCopy.length > townConfig.length) {
    console.error("Svoz měl duplicitní města");
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

export const parseRawRide = (
  rawRide: RawRide,
  shiftTime: ShiftTime,
): Ride[] => {
  const tracks = resolveTracks(rawRide.towns);

  if (!tracks) return [];
  const rides: Ride[] = [];

  tracks.forEach((track: Town[]) => {
    const people = rawRide.people.filter((employee: JoinedTableEmployee) =>
      track.includes(employee.town.toUpperCase() as Town)
    );

    const startTime = shiftTime === "MORNING" ? "5:30" : "14:30";
    const endTime = shiftTime === "MORNING" ? "15:30" : "0:00";

    // add track endings accordingly
    const parsedTrack = addBranchesToTracks(track, people);
    const reversedTrack = [...parsedTrack].reverse();

    const ride: Ride = {
      startTime: startTime,
      endTime: endTime,
      people: people,
      track: parsedTrack,
      notes: "",
      reversedTrack: reversedTrack,
      reversePeople: [...people],
      reverseNotes: "",
    };

    rides.push(ride);
  });

  return rides;
};

const addBranchesToTracks = (
  track: Track,
  poeple: JoinedTableEmployee[],
): Track => {
  const haveEast = poeple.some((employee) => employee.shiftBranch === "EAST");
  const haveWest = poeple.some((employee) => employee.shiftBranch === "WEST");
  const isWestPrio = track.some((town) => town === "PŘÍBRAM");
  const suffix: Branch[] = [];

  if (haveEast) {
    suffix.push("EAST");
  }

  if (haveWest) {
    if (isWestPrio) {
      suffix.push("WEST");
    } else {
      suffix.unshift("WEST");
    }
  }

  return [...track, ...suffix] as Track;
};

export const parseRawShiftTableData = (rawShiftTableData: string[][]) => {
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