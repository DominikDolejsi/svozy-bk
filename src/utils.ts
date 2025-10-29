import Papa, { type ParseResult } from "papaparse";
import {
  type Branch,
  type Employee,
  type JoinedTableEmployee,
  SHIFT_TIME,
  type ShiftEmployee,
  TABLE_IDENTIFICATORS,
  TOWN,
  type Town,
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
