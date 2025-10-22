import Papa, { type ParseResult } from "papaparse";
import { TOWN, type Town } from "./types";

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
      error: (error) => {
        reject(error)
      },
    });
  });
};

export function mapToTown(value: string): Town {
  const normalized = value.toUpperCase() as Town;
  
  // Validate it's actually a valid town
  if (!(normalized in TOWN)) {
    // throw new Error(`Invalid town: ${value}`);
    console.error(`Invalid town: ${value}`)
  }
  
  return normalized;
}

