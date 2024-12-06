import dotenv from "dotenv";
dotenv.config();

import { Connection } from "../providers/ifs/internal/Connection";
import { IFSConnection } from "../providers/ifs/connection";
import { get_new_revision, get_prefix_part_no, test_plsql } from "./check_functions";

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

beforeAll(async () => {
  const ifs_connection = new IFSConnection();
  await ifs_connection.connect()

  ifs = ifs_connection.client;
  tx = ifs.BeginTransaction();
});

afterAll(async () => {
  // await tx.Commit();
  await tx.Rollback();
  await ifs.EndSession();
});

const test = {
  id: 'f7648d8e-162c-4107-ab7e-d77b68c58dd2',
  parentId: '',
  partNumber: '2212899',
  revision: 'B',
  title: 'Gangway tower - Outfitting',
  units: 'PCS',
  author: 'Simon Sakseid',
  state: 'Released',
  description: '',
  category: 'Engineering',
  mass: '81000000',
  material: '',
  materialCertificate: '',
  serialNumber: '',
  childCount: '66',
  supplier: '',
  supplierPartNumber: '',
  supplierDescription: '',
  isSpare: '',
  isCritical: 'False',
  isLongLead: 'False',
  quantity: '',
  position: '',
  parentPartNumber: '',
  parentRevision: '',
  released: '2024-10-08 11:12:37Z'
}