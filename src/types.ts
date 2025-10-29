export type Employee = {
  name: string;
  town: Town;
  branch: Branch;
  phone: string;
  whatsapp: boolean;
};

export type ShiftEmployee = {
  name: string;
  shiftBranch: Branch;
  shifts: Shift[];
};

export type Shift = {
  day: string;
  time: string;
};

export type WorkDay = {
  date: string;
  workers: Record<Employee["name"], string>;
};

export type JoinedTableEmployee = {
  originBranch: Branch;
  town: Town;
} & ShiftEmployee;

export type RawRide = {
  day: string;
  time: ShiftTime;
  people: JoinedTableEmployee[];
  towns: Town[];
};

export type WorkShift = {
  day: string;
  time: string;
  workers: string[];
  towns: Town[];
};

export const BRANCH = {
  WEST: "West",
  EAST: "East",
  DT: "",
} as const;

export type Branch = keyof typeof BRANCH;

export const TOWN = {
  PÍSEK: "Písek",
  STRAKONICE: "Strakonice",
  MIROVICE: "Mírovice",
  PŘÍBRAM: "Příbram",
} as const;

export type Town = keyof typeof TOWN;

export const SHIFT_TIME = {
  MORNING: "06:00-15:30",
  AFTERNOON: "15:00-24:00",
} as const;

export type ShiftTime = keyof typeof SHIFT_TIME;

export const EMPLOYEE_TABLE_HEADERS = {
  NAME: "jméno",
  TOWN: "město",
  BRANCH: "pobočka",
  PHONE: "telefon",
  WHATSAPP: "ve whatsapp skupině",
} as const;

export type EmployeeTableHeaders = keyof typeof EMPLOYEE_TABLE_HEADERS;

export const TABLE_IDENTIFICATORS = {
  BRANCH_LINE: "bk ",
  BRANCH_END: "celkem",
  BRANCH_HEADER: "jméno",
  BRANCH_IGNORE: "volná směna",
} as const;
