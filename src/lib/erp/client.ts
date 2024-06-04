import sql from "mssql";

export const getERPConnection = async () => {
  return await sql.connect({
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_HOST,
    database: process.env.MSSQL_DATABASE,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  });
};
