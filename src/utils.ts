import Papa, { type ParseResult } from "papaparse";

export const parseSVCFileToJSON = <T>(file: File, config?: Partial<Papa.ParseLocalConfig<T, File>>): Promise<ParseResult<T>> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      ...config,
      skipEmptyLines: "greedy",
      complete: (results: ParseResult<T>) => {
        console.log(results)
        resolve(results)
      },
      error: (error) => {
        console.log("Error in Papa parse");
      }
    })
  })
}