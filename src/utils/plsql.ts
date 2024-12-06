import fs from "fs"
import path from "path"
import { FileNotFoundError } from "./error";

export class PLSQL {
    private static HOME = "assets\\plsql";
    private static FUNCTIONS = "functions";
    private static OBJECTS = "objects";
    private static PART = "part";
    private static STRUCT = "struct";

    /* BASE FUNCTIONS */
    public static get Types__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.getFunctionPath())
    }

    public static get Get_Part_No__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.getFunctionPath())
    }

    public static get Get_New_Revision__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.getFunctionPath())
    }

    public static get Check_Editable__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.getFunctionPath())
    }

    public static get Check_Error__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.getFunctionPath())
    }

    /* OBJECT FUNCTIONS */
    public static get Get_Catalog_Part__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.OBJECTS, PLSQL.getFunctionPath())
    }

    public static get Get_Engineering_Part__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.OBJECTS, PLSQL.getFunctionPath())
    }

    public static get Get_Engineering_Latest__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.OBJECTS, PLSQL.getFunctionPath())
    }

    public static get Check_Engineering_Part__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.OBJECTS, PLSQL.getFunctionPath())
    }
    
    public static get Get_Inventory_Part__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.OBJECTS, PLSQL.getFunctionPath())
    }

    public static get Get_Purchase_Part__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.OBJECTS, PLSQL.getFunctionPath())
    }

    public static get Get_Sales_Part__() {
        return PLSQL.parseFile(PLSQL.FUNCTIONS, PLSQL.OBJECTS, PLSQL.getFunctionPath())
    }

    /* PART PROCEDURES */
    public static get Add_Manufacturer__() {
        return PLSQL.parseFile(PLSQL.PART, PLSQL.getFunctionPath())
    }

    public static get Add_Spesification__() {
        return PLSQL.parseFile(PLSQL.PART, PLSQL.getFunctionPath())
    }

    public static get Create_Catalog_Part__() {
        return PLSQL.parseFile(PLSQL.PART, PLSQL.getFunctionPath())
    }

    public static get Create_Engineering_Part__() {
        return PLSQL.parseFile(PLSQL.PART, PLSQL.getFunctionPath())
    }

    public static get Create_Inventory_Part__() {
        return PLSQL.parseFile(PLSQL.PART, PLSQL.getFunctionPath())
    }

    public static get Create_Purchase_Part__() {
        return PLSQL.parseFile(PLSQL.PART, PLSQL.getFunctionPath())
    }

    public static get Create_Sales_Part__() {
        return PLSQL.parseFile(PLSQL.PART, PLSQL.getFunctionPath())
    }

    public static get Set_Weight_Net__() {
        return PLSQL.parseFile(PLSQL.PART, PLSQL.getFunctionPath())
    }

    /* STRUCT PROCEDURES */
    public static get Add_Struct_Part__() {
        return PLSQL.parseFile(PLSQL.STRUCT, PLSQL.getFunctionPath())
    }

    public static get Set_Struct_State__() {
        return PLSQL.parseFile(PLSQL.STRUCT, PLSQL.getFunctionPath())
    }

    public static get Check_Child_Count__() {
        return PLSQL.parseFile(PLSQL.STRUCT, PLSQL.getFunctionPath())
    }

    /* PRIVATE HELPERS */
    private static getFunctionPath() {
        const err = new Error();
        const stackLines = err.stack?.split("\n");

        if (stackLines == null || stackLines.length < 3) {
            throw new Error("Failed to get caller name")
        }

        const callerLine = stackLines[2].trim();
        const nameMatch = callerLine.match(/\[as\s+(\w+)\]/);

        if (nameMatch == null) {
            throw new Error("Failed to get caller name")
        }

        return nameMatch[1].toLowerCase().replace("__", ".sql")
    }

    private static parseFile(...args: string[]) {
        const completePath = path.join(process.cwd(), PLSQL.HOME, ...args)

        if (!fs.existsSync(completePath)) {
            throw new FileNotFoundError(`Failed to load PLSQL file: ${completePath}`)
        }

        return fs.readFileSync(completePath, 'utf8');
    }
} 