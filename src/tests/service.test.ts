import dotenv from "dotenv";
dotenv.config();

import { add_manufacturer } from "@procedures/parts/add_manufacturer";
import { add_technical_spesification } from "@procedures/parts/add_technical_spesification";
import { create_catalog_part } from "@procedures/parts/create_catalog_part";
import { create_engineering_part } from "@procedures/parts/create_engineering_part";
import { create_inventory_part } from "@procedures/parts/create_inventory_part";
import { create_purchase_part } from "@procedures/parts/create_purchase_part";
import { create_sales_part } from "@procedures/parts/create_sales_part";
import { IFSConnection } from "@providers/ifs/connection";
import { Connection } from "@providers/ifs/internal/Connection";
import { MSSQLConnection } from "@providers/mssql/connection";
import { MSSQLRow } from "@providers/mssql/types";
import { ConnectionPool } from "mssql";
import { get_new_revision } from "./check_functions";

let mssql: ConnectionPool;
let ifs: Connection;
let tx: Connection;

describe("Create IFS Parts", () => {
  it("Catalog:\t\tshould not throw an error", async () => {
    await expect(create_catalog_part(tx, sub_part)).resolves.not.toThrow();
  });

  it("Technical:\tshould not throw an error", async () => {
    await expect(add_technical_spesification(tx, sub_part)).resolves.not.toThrow();
  });

  it("Manufacturer:\tshould not throw an error", async () => {
    await expect(add_manufacturer(tx, sub_part)).resolves.not.toThrow();
  });

  it("Engineering:\tshould not throw an error", async () => {
    await expect(create_engineering_part(tx, sub_part)).resolves.not.toThrow();
  });

  it("Inventory:\tshould not throw an error", async () => {
    await expect(create_inventory_part(tx, sub_part)).resolves.not.toThrow();
  });

  it("Purchase:\t\tshould not throw an error", async () => {
    await expect(create_purchase_part(tx, sub_part)).resolves.not.toThrow();
  });

  it("Sales:\t\tshould not throw an error", async () => {
    await expect(create_sales_part(tx, sub_part)).resolves.not.toThrow();
  });

  it("Commit:\t\tshould not throw an error", async () => {
    await expect(tx.Commit()).resolves.not.toThrow();
  });
});

describe("Random Test", () => {
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

beforeAll(async () => {
  const ifs_connection = new IFSConnection();
  ifs = await ifs_connection.instance();
  tx = await ifs.BeginTransaction();

  const mssql_connection = new MSSQLConnection();
  mssql = await mssql_connection.instance();
});

afterAll(async () => {
  await ifs.EndSession();
  await mssql.close();
});

const sub_part: MSSQLRow = {
  ItemNumber: "16107797",
  Revision: "A",
  Quantity: "4",
  Pos: "6",
  ParentItemNumber: "2102017",
  ParentItemRevision: "B",
  ChildCount: "0",
  Category: "Engineering",
  Title: "Lock plate Or Something",
  Description: "Round Bar Ø125 L=12",
  Units: "Each",
  LifecycleState: false ? "Obsolete" : "Released",
  Category_1: "",
  Category_2: "",
  Category_3: "",
  Category_4: "",
  InternalDescription: "",
  Mass_g: "",
  Material: "D36",
  MaterialCertifikate: "3.1",
  Project: "",
  SerialNo: "",
  SparePart: "",
  Vendor: "Parker",
  CriticalItem: "False",
  LongLeadItem: "False",
  SupplierPartNo: "PART03",
  ReleaseDate: "2024-05-24 02:09:58Z",
  Status: "Posted",
  ErrorDescription: null,
  ReleasedBy: "Dan Lazar",
  LastUpdatedBy: "Techjob",
  "State(Historical)": "Released",
  InventorQuantity: "4",
  NewRevision: null,
  NewParentItemRevision: null,
};
