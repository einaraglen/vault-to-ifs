import dotenv from "dotenv";
dotenv.config();

import { Connection } from "../providers/ifs/internal/Connection";
import { IFSConnection } from "../providers/ifs/connection";
import { get_new_revision, get_prefix_part_no } from "./check_functions";
import { fix_part_qty, fix_part_units } from "../utils/tools";

let ifs: Connection;
let tx: Connection;

describe("PLSQL Function Revision", () => {
  it("should equal A01", async () => {
    await expect(get_new_revision(tx, "A")).resolves.toEqual("A01");
  });

  it("should equal A02", async () => {
    await expect(get_new_revision(tx, "A01")).resolves.toEqual("A02");
  });

  it("should equal A100", async () => {
    await expect(get_new_revision(tx, "A99")).resolves.toEqual("A100");
  });

  it("should equal A01", async () => {
    await expect(get_new_revision(tx, "AB")).resolves.toEqual("A01");
  });
});

describe("PLSQL Function PartNo", () => {
  it("should equal SE2217441", async () => {
    await expect(get_prefix_part_no(tx, "2217441")).resolves.toEqual("SE2217441");
  });

  it("should equal 16104190", async () => {
    await expect(get_prefix_part_no(tx, "16104190")).resolves.toEqual("16104190");
  });

  it("should equal SE7000031", async () => {
    await expect(get_prefix_part_no(tx, "7000031")).resolves.toEqual("SE7000031");
  });

  it("should equal PD-13163AA4-EAS-001", async () => {
    await expect(get_prefix_part_no(tx, "PD-13163AA4-EAS-001")).resolves.toEqual("PD-13163AA4-EAS-001");
  });
});

// describe("Helper Function Test", () => {
//   it("Check QTY parser", () => {
//     expect(fix_part_qty("1740 mm")).toBe("1740")
//   });

//   it("Check Unit parser Each", () => {
//     expect(fix_part_units("5", "Each")).toBe("PCS")
//   });

//   it("Check Unit parser m QTY", () => {
//     expect(fix_part_units("5 m", "Each")).toBe("m")
//   });

//   it("Check Unit parser m Units", () => {
//     expect(fix_part_units("5", "m")).toBe("m")
//   });

//   it("Check Unit parser mn QTY", () => {
//     expect(fix_part_units("5 mm", "Each")).toBe("mm")
//   });

//   it("Check Unit parser mn Units", () => {
//     expect(fix_part_units("5", "mm")).toBe("mm")
//   });

//   it("Check Unit parser stk", () => {
//     expect(fix_part_units("5", "stk")).toBe("PCS")
//   });
// });

beforeAll(async () => {
  const ifs_connection = new IFSConnection();
  ifs = await ifs_connection.instance();
  tx = await ifs.BeginTransaction();
});

afterAll(async () => {
  // await tx.Commit();
  await tx.Rollback();
  await ifs.EndSession();
});