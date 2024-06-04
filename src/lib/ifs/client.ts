import oracledb from "oracledb";
import { Callback, Database } from "../../types/database";

//@ts-ignore
oracledb.oracleDbDebug = true;

export const IFSConnection = async (): Promise<Database> => {
  const connection = await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_USER,
    connectString: process.env.ORACLE_HOST, //"your_host:your_port/your_service_name",
    // privilege: oracledb.SYSOPER
  });

  const query = (sql: string) => {
      return connection.execute(sql)
  }

  const transaction = async (callback: Callback) => {
    try {
      await connection.execute('BEGIN');
      await callback({ query });
      await connection.commit();
      Logger.info("IFS transaction completed")
    } catch (err) {
      await connection.rollback();
      Logger.error("IFS transaction failed")
      throw err;
    }
  }

  const close = () => connection.close()

  return { query, transaction, close }
};
