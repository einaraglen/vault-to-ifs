import { Connection } from "../providers/ifs/internal/Connection";

export const get_catalog_part = async (client: Connection, part_no: string) => {
  const res = await client.Sql(`SELECT * FROM &AO.PART_CATALOG WHERE (PART_NO = :p0)`, { p0: part_no });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};

export const get_catalog_alternative_part = async (client: Connection, part_no: string) => {
  const res = await client.Sql(`SELECT * FROM &AO.PART_CATALOG_ALTERNATIVE WHERE (PART_NO = :p0)`, { p0: part_no });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};

export const get_engineering_part = async (client: Connection, part_no: string) => {
  const res = await client.Sql(`SELECT * FROM &AO.ENG_PART_MASTER_MAIN WHERE (PART_NO = :p0)`, { p0: part_no });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};

export const get_inventory_part = async (client: Connection, part_no: string) => {
  const res = await client.Sql(`SELECT * FROM &AO.INVENTORY_PART WHERE (PART_NO = :p0)`, { p0: part_no });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};

export const get_purchase_part = async (client: Connection, part_no: string) => {
  const res = await client.Sql(`SELECT * FROM &AO.INVENTORY_PART WHERE (PART_NO = :p0)`, { p0: part_no });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};

export const get_sales_part = async (client: Connection, part_no: string) => {
  const res = await client.Sql(`SELECT * FROM &AO.SALES_PART WHERE (PART_NO = :p0)`, { p0: part_no });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};
