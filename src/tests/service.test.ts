import dotenv from "dotenv";
dotenv.config();

import { Connection } from "../providers/ifs/internal/Connection";
import { create_catalog_part } from "../procedures/parts/create_catalog_part";
import { add_technical_spesification } from "../procedures/parts/add_technical_spesification";
import { add_manufacturer } from "../procedures/parts/add_manufacturer";
import { create_engineering_part } from "../procedures/parts/create_engineering_part";
import { create_inventory_part } from "../procedures/parts/create_inventory_part";
import { create_purchase_part } from "../procedures/parts/create_purchase_part";
import { create_sales_part } from "../procedures/parts/create_sales_part";
import { IFSConnection } from "../providers/ifs/connection";
import { get_misc_part_data, get_new_revision, test_get_engineering, update_misc_quantity } from "./check_functions";
import { create_part } from "./new_create";
import { fix_part_qty, fix_part_units } from "../utils/tools";

let ifs: Connection;
let tx: Connection;

// describe("Create IFS Parts", () => {
//   it("Catalog:\t\tshould not throw an error", async () => {
//     await expect(create_catalog_part(tx, part)).resolves.not.toThrow();
//   });

//   it("Technical:\tshould not throw an error", async () => {
//     await expect(add_technical_spesification(tx, part)).resolves.not.toThrow();
//   });

//   it("Manufacturer:\tshould not throw an error", async () => {
//     await expect(add_manufacturer(tx, part)).resolves.not.toThrow();
//   });

//   it("Engineering:\tshould not throw an error", async () => {
//     await expect(create_engineering_part(tx, part)).resolves.not.toThrow();
//   });

//   it("Inventory:\tshould not throw an error", async () => {
//     await expect(create_inventory_part(tx, part)).resolves.not.toThrow();
//   });

//   it("Purchase:\t\tshould not throw an error", async () => {
//     await expect(create_purchase_part(tx, part)).resolves.not.toThrow();
//   });

//   it("Sales:\t\tshould not throw an error", async () => {
//     await expect(create_sales_part(tx, part)).resolves.not.toThrow();
//   });

//   it("Commit:\t\tshould not throw an error", async () => {
//     await expect(tx.Commit()).resolves.not.toThrow();
//   });
// });

// describe("Random Test", () => {
//   it("should equal A01", async () => {
//     await expect(get_new_revision(tx, "A")).resolves.toEqual("A01");
//   });

//   it("should equal A02", async () => {
//     await expect(get_new_revision(tx, "A01")).resolves.toEqual("A02");
//   });

//   it("should equal A100", async () => {
//     await expect(get_new_revision(tx, "A99")).resolves.toEqual("A100");
//   });

//   it("should equal A01", async () => {
//     await expect(get_new_revision(tx, "AB")).resolves.toEqual("A01");
//   });
// });

describe("Helper Function Test", () => {
  // it("Add Misc Line", async () => {
  //   await expect(get_misc_part_data(tx)).resolves.not.toThrow();
  // });

  // it("Update Misc Line", async () => {
  //   await expect(update_misc_quantity(tx)).resolves.not.toThrow();
  // });

  // it("Temp Test", async () => {
  //   await expect(test_get_engineering(tx)).resolves.not.toThrow();
  // });



  it("Check QTY parser", () => {
    expect(fix_part_qty("1740 mm")).toBe("1740")
  });

  it("Check Unit parser Each", () => {
    expect(fix_part_units("5", "Each")).toBe("PCS")
  });

  it("Check Unit parser m QTY", () => {
    expect(fix_part_units("5 m", "Each")).toBe("m")
  });

  it("Check Unit parser m Units", () => {
    expect(fix_part_units("5", "m")).toBe("m")
  });

  it("Check Unit parser mn QTY", () => {
    expect(fix_part_units("5 mm", "Each")).toBe("mm")
  });

  it("Check Unit parser mn Units", () => {
    expect(fix_part_units("5", "mm")).toBe("mm")
  });

  it("Check Unit parser stk", () => {
    expect(fix_part_units("5", "stk")).toBe("PCS")
  });




  // it("New Create Function", async () => {
  //   await expect(create_part(tx, { 
  //     part_no: "1337.3",
  //     description: "Lamp , Lightning fixture, Explosion protected light fitting, ExLin NE+, 2400lm, 110-277 VAC, 22W, IP66/67, 2xM25, battery",
  //     unit: "PCS",
  //     rev: "A01" 
  //   })).resolves.not.toThrow();
  // });
});

// beforeAll(async () => {
//   const ifs_connection = new IFSConnection();
//   ifs = await ifs_connection.instance();
//   tx = await ifs.BeginTransaction();
// });

// afterAll(async () => {
//   // await tx.Commit();
//   await tx.Rollback();
//   await ifs.EndSession();
// });

const part: any = {
  "partNumber": "16610099",
  "revision": "A",
  "title": "ACCESS P. WORKING LIGHT I",
  "units": "PCS",
  "author": "Simon Sakseid",
  "state": "Released",
  "description": "THIS IS NEW DESCRIPTION",
  "category": "Purchased Components",
  "mass": "8300",
  "material": "Generic",
  "materialCertificate": "",
  "serialNumber": "",
  "childCount": "0",
  "supplier": "EATON",
  "supplierPartNumber": "12320120103",
  "supplierDescription": "ExLin 3L-1 NE+ G C S 7 50 T1 2_6 M25K",
  "isSpare": "",
  "isCritical": "True",
  "isLongLead": "False",
  "quantity": "8",
  "position": "18",
  "parentPartNumber": "2212899",
  "parentRevision": "B",
  "released": "2023-09-26 12:58:06Z"
}
