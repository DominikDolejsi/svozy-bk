export type Employee = {
  name: string,
  town: string,
  branch: Branch,
}

export type ShiftFile = {
  name: string,
  [key: string]: string,
}

export type WorkDay = {
  date: string,
  workers: Record<Employee["name"], string>,
}

export const BRANCH = {
  WEST: "West",
  EAST: "East"
} as const;

export type Branch = keyof typeof BRANCH;
