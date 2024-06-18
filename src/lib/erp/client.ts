import sql from "mssql";
import { Callback } from "../../types/database";

export const ERPConnection = async () => {
  const connection = await sql.connect({
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_HOST,
    database: process.env.MSSQL_DATABASE,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  });

  const query = async (sql: string) => {
    return connection.request().query(sql)
  };

  const transaction = async (callback: Callback<sql.Request>  ) => {
    const transaction = new sql.Transaction(connection);
    try {
      await transaction.begin();
      const request = new sql.Request(transaction);
      await callback(request);
      await transaction.commit();
      Logger.info("ERP transaction completed")
    } catch (err) {
      transaction.rollback();
      Logger.error("ERP transaction failed")
      throw err;
    }
  };

  const close = () => connection.close();

  return { query, transaction, close };
};
