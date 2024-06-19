import { IFSConfig, IFSConnection } from "./providers/ifs/connection";
import { MSSQLConfig, MSSQLConnection } from "./providers/mssql/connection";

const ifs_config: IFSConfig = {
  server: process.env.IFS_HOST,
  user: process.env.IFS_USERNAME,
  password: process.env.IFS_PASSWORD,
  version: process.env.IFS_VERSION,
  os_user: process.env.IFS_OS_USER,
};

const mssql_config: MSSQLConfig = {
  domain: process.env.MSSQL_DOMAIN,
  user: process.env.MSSQL_USERNAME,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_HOST,
  database: process.env.MSSQL_DATABASE,
};

export const run = async () => {

  await run_mssql_query();
  // await run_ifs_query();

};

const run_mssql_query = async () => {
  const sql_connection = new MSSQLConnection(mssql_config);

  const sql_client = await sql_connection.instance();

  const result = await sql_client.query`SELECT TOP (10) * FROM [ERP].[dbo].[BOM] ORDER BY [LastUpdate] DESC`;
  
  console.log(result);

  await sql_connection.close();
};

const run_ifs_query = async () => {
  const ifs_connection = new IFSConnection(ifs_config);

  const ifs_client = await ifs_connection.instance();

  const response = await ifs_client.Sql(
    `SELECT * FROM &AO.customer_info WHERE ROWNUM <= :count`,
    { count: 20 }
  );

  if (!response.ok) {
    throw Error(response.errorText);
  }

  console.log(response.result);

  await ifs_connection.close();
};
