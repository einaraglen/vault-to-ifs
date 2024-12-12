import fs from "fs"
import path from "path"

export class PLSQL {
  private static HOME = "assets\\plsql";
  private static FUNCTIONS = "functions";
  private static PARTS = "parts";
  private static STRUCTS = "structures";

  /* FUNCTIONS */
  public static get Part_Number__() {
    return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.getFunctionPath())
  }

  public static get Part_Revision__() {
    return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.getFunctionPath())
  }

  public static get Part_State__() {
    return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.getFunctionPath())
  }

  public static get Part_Tracked__() {
    return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.getFunctionPath())
  }

  public static get Part_Children__() {
    return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.getFunctionPath())
  }


  /* PART PROCEDURES */
  public static get Serial_Tracking__() {
    return PLSQL.parseFile(PLSQL.PARTS, PLSQL.getFunctionPath())
  }

  public static get Catalog__() {
    return PLSQL.parseFile(PLSQL.PARTS, PLSQL.getFunctionPath())
  }

  public static get Engineering__() {
    return PLSQL.parseFile(PLSQL.PARTS, PLSQL.getFunctionPath())
  }

  public static get Inventory__() {
    return PLSQL.parseFile(PLSQL.PARTS, PLSQL.getFunctionPath())
  }

  public static get Purchase__() {
    return PLSQL.parseFile(PLSQL.PARTS, PLSQL.getFunctionPath())
  }

  public static get Sales__() {
    return PLSQL.parseFile(PLSQL.PARTS, PLSQL.getFunctionPath())
  }

  public static get Technical__() {
    return PLSQL.parseFile(PLSQL.PARTS, PLSQL.getFunctionPath())
  }

  public static get Structure__() {
    return PLSQL.parseFile(PLSQL.STRUCTS, PLSQL.getFunctionPath())
  }

  public static get State__() {
    return PLSQL.parseFile(PLSQL.STRUCTS, PLSQL.getFunctionPath())
  }

  private static getCallerV1(line: string) {
      const regex = /\[as\s+(\w+)\]/;
      const nameMatch = line.match(regex);

      return nameMatch;
  }

  private static getCallerV2(line: string) {
    const regex = /at (?:get|call)?\s*([\w$][\w\d_$]*)/
    const nameMatch = line.match(regex);

    return nameMatch;
}

  /* PRIVATE HELPERS */
  private static getFunctionPath() {
    const err = new Error();
    const stackLines = err.stack?.split("\n");

    if (stackLines == null || stackLines.length < 3) {
      throw new Error("Missing Stack Lines")
    }

    const callerLine = stackLines[2].trim();
    const nameMatch = this.getCallerV1(callerLine) ?? this.getCallerV2(callerLine)

    if (nameMatch == null) {
      throw new Error("Failed to get caller name")
    }

    return nameMatch[1].toLowerCase().replace("__", ".sql")
  }

  private static parseFile(...args: string[]) {
    const completePath = path.join(process.cwd(), PLSQL.HOME, ...args)

    if (!fs.existsSync(completePath)) {
      throw new Error(`Failed to load PLSQL file: ${completePath}`)
    }

    return fs.readFileSync(completePath, 'utf8');
  }
} 