export type Employee = {
  name: string;
  town: Town;
  branch: Branch;
};

export type Shift = {
  name: string;
  branch: string;
  [key: string]: string;
};

export type WorkDay = {
  date: string;
  workers: Record<Employee["name"], string>;
};

export const BRANCH = {
  WEST: "West",
  EAST: "East",
} as const;

export type Branch = keyof typeof BRANCH;

export const TOWN = {
  PÍSEK: "Písek",
  STRAKONICE: "Strakonice",
  MÍROVICE: "Mírovice",
  PŘÍBRAM: "Příbram"
} as const;

export type Town = keyof typeof TOWN;

export const SHIFT_TIME = {
  MORNING: "06:00-15:30",
  AFTERNOON: "15:00-24:00"
} as const

export type ShiftTime = keyof typeof SHIFT_TIME
