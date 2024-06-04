import oracledb from "oracledb";

export const getIFSConnection = async () => {
  return await oracledb.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_USER,
    connectString: process.env.ORACLE_HOST //"your_host:your_port/your_service_name",
  });
};
