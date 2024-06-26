import { IFSConfig, IFSConnection } from "../providers/ifs/connection";
import dotenv from "dotenv";
import { Connection } from "../providers/ifs/internal/Connection";
import { create_catalog_part } from "../procedures/parts/create_catalog_part";
import { add_technical_spesification } from "../procedures/parts/add_technical_spesification";
import { create_engineering_part } from "../procedures/parts/create_engineering_part";
import { create_inventory_part } from "../procedures/parts/create_inventory_part";
import { create_purchase_part } from "../procedures/parts/create_purchase_part";
import { create_sales_part } from "../procedures/parts/create_sales_part";
import { MSSQLRow } from "../providers/mssql/types";
import { InMessage, convert_to_part } from "../utils";
import { ConnectionPool } from "mssql";
import { MSSQLConfig, MSSQLConnection } from "../providers/mssql/connection";
import { get_master_parts } from "../procedures/vault/get_master_parts";

let mssql: ConnectionPool;
let ifs: Connection;
let tx: Connection;
let message: InMessage;

describe("Get ERP Parts", () => {
  it("Master:\t\tshould not throw an error", async () => {
    await expect(get_master_parts(mssql)).resolves.not.toThrow();
  });
});

describe("Create IFS Parts", () => {
  it("Catalog:\t\tshould not throw an error", async () => {
    await expect(create_catalog_part(tx, message)).resolves.not.toThrow();
  });

  it("Technical:\tshould not throw an error", async () => {
    await expect(add_technical_spesification(tx, message)).resolves.not.toThrow();
  });

  it("Engineering:\tshould not throw an error", async () => {
    await expect(create_engineering_part(tx, message)).resolves.not.toThrow();
  });

  it("Inventory:\tshould not throw an error", async () => {
    await expect(create_inventory_part(tx, message)).resolves.not.toThrow();
  });

  it("Purchase:\t\tshould not throw an error", async () => {
    await expect(create_purchase_part(tx, message)).resolves.not.toThrow();
  });

  it("Sales:\t\tshould not throw an error", async () => {
    await expect(create_sales_part(tx, message)).resolves.not.toThrow();
  });
});

describe("Create IFS Structure", () => {
  it("Structure:\tshould not throw an error", async () => {
    await expect(create_catalog_part(tx, message)).resolves.not.toThrow();
  });

  it("Spare:\t\tshould not throw an error", async () => {
    await expect(add_technical_spesification(tx, message)).resolves.not.toThrow();
  });
});

beforeAll(async () => {
  dotenv.config();

  const mssql_config: MSSQLConfig = {
    domain: process.env.MSSQL_DOMAIN,
    user: process.env.MSSQL_USERNAME,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_HOST,
    database: process.env.MSSQL_DATABASE,
  };

  const ifs_config: IFSConfig = {
    server: process.env.IFS_HOST,
    user: process.env.IFS_USERNAME,
    password: process.env.IFS_PASSWORD,
    version: process.env.IFS_VERSION,
    os_user: process.env.IFS_OS_USER,
  };

  const ifs_connection = new IFSConnection(ifs_config);
  ifs = await ifs_connection.instance();
  tx = await ifs.BeginTransaction();

  const mssql_connection = new MSSQLConnection(mssql_config);
  mssql = await mssql_connection.instance();

  message = convert_to_part(part);
});

afterAll(async () => {
  await tx.Rollback();
  await ifs.EndSession();
  await mssql.close();
});

const part: MSSQLRow = {
  rowID: "183E4E62-65AF-4378-8F56-8FBABC5980DF",
  ItemNumber: "2208567",
  Revision: "A",
  Quantity: "4",
  Pos: "6",
  ParentItemNumber: "2208100",
  ParentItemRevision: "A",
  ChildCount: "0",
  Category: "Engineering",
  Title: "Lock plate",
  Description: "Round Bar Ø125 L=12",
  Units: "Each",
  LifecycleState: "Released",
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
  Vendor: "",
  CriticalItem: "False",
  LongLeadItem: "False",
  SupplierPartNo: "",
  ReleaseDate: "2024-05-24 02:09:58Z",
  LastUpdate: new Date("2024-05-27T08:44:43.637Z"),
  Status: "Posted",
  ErrorDescription: null,
  ReleasedBy: "Dan Lazar",
  LastUpdatedBy: "Techjob",
  "State(Historical)": "Released",
  TransactionId: "7f76ecef-935c-4dbb-8719-58373a32e4a4",
  InventorQuantity: "4",
  NewRevision: null,
  NewParentItemRevision: null,
};
