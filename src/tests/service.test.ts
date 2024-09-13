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
import { get_new_revision } from "./check_functions";

let ifs: Connection;
let tx: Connection;

describe("Create IFS Parts", () => {
  it("Catalog:\t\tshould not throw an error", async () => {
    await expect(create_catalog_part(tx, part)).resolves.not.toThrow();
  });

  it("Technical:\tshould not throw an error", async () => {
    await expect(add_technical_spesification(tx, part)).resolves.not.toThrow();
  });

  it("Manufacturer:\tshould not throw an error", async () => {
    await expect(add_manufacturer(tx, part)).resolves.not.toThrow();
  });

  it("Engineering:\tshould not throw an error", async () => {
    await expect(create_engineering_part(tx, part)).resolves.not.toThrow();
  });

  it("Inventory:\tshould not throw an error", async () => {
    await expect(create_inventory_part(tx, part)).resolves.not.toThrow();
  });

  it("Purchase:\t\tshould not throw an error", async () => {
    await expect(create_purchase_part(tx, part)).resolves.not.toThrow();
  });

  it("Sales:\t\tshould not throw an error", async () => {
    await expect(create_sales_part(tx, part)).resolves.not.toThrow();
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
});

afterAll(async () => {
  await tx.Commit();
  await ifs.EndSession();
});

const part: any = {
  partNumber: "1122334455",
  revision: "A",
  title: "Test Inventory Fix",
  units: "Pcs",
  author: "einar.aglen",
  state: "Released",
  description: "Test",
  category: "Test Part",
  mass: "100",
  material: "",
  materialCertificate: "",
  serialNumber: "",
  childCount: "0",
  supplier: "Parker",
  supplierPartNumber: "some-supplier-number",
  supplierDescription: "",
  isSpare: "False",
  isCritical: "False",
  isLongLead: "False",
  quantity: "",
  position: "",
  parentPartNumber: "",
  parentRevision: "",
  released: "2024-07-03 10:49:24Z",
};
