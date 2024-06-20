import { MSSQLConfig } from "./providers/mssql/connection";

const mssql_config: MSSQLConfig = {
    domain: process.env.MSSQL_DOMAIN,
    user: process.env.MSSQL_USERNAME,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_HOST,
    database: process.env.MSSQL_DATABASE,
  };
  

// const run_mssql_query = async () => {
//     const sql_connection = new MSSQLConnection(mssql_config);
  
//     const sql_client = await sql_connection.instance();
  
//     // TRANSACTION-ID: b1922e6a-645f-4cc9-b6cc-03eabf573ab6
//     // const result = await sql_client.query`SELECT TOP (10) * FROM [ERP].[dbo].[BOM] WHERE [ParentItemNumber] = '2208100' OR [ItemNumber] = '2208100'`;
//     const result = await sql_client.query`SELECT TOP (10) * FROM [ERP].[dbo].[BOM] WHERE [Status] = 'Posted' AND [ParentItemNumber] IS NULL`;
  
//     console.log(result);
  
//     await sql_connection.close();
//   };
  
//   const get_bom_list = async (sql_client: ConnectionPool, parent_number: string) => {
//     const result = await sql_client.query`SELECT TOP (10) * FROM [ERP].[dbo].[BOM] WHERE [ParentItemNumber] = '${parent_number}' OR [ItemNumber] = '${parent_number}'`;
//   };
  
//   const run_ifs_query = async () => {
//     const ifs_connection = new IFSConnection(ifs_config);
  
//     const ifs_client = await ifs_connection.instance();
  
//     // const response = await ifs_client.Sql(`SELECT * FROM &AO.customer_info WHERE ROWNUM <= :count`, { count: 20 });
  
//     // const response = await ifs_client.Sql(`SELECT &AO.ENG_PART_MASTER_API.Check_Part_Exists(:p0) FROM DUAL`, { p0: "16700171" });
//     const sql_query = await ifs_client.Sql(
//       `SELECT 
//         CASE &AO.ENG_PART_MASTER_API.Check_Part_Exists(:p0)
//         WHEN 0 THEN 'false' 
//         ELSE 'true' 
//       END AS IS_ENG_PART_MASTER,
//         &AO.part_catalog_api.get_description(:p0) AS DESCRIPTION,
//         :p0 as PART_NO
//        FROM DUAL`,
//       { p0: "16700171" }
//     );
  
//     // const plsql_query = await ifs_client.PlSql(
//     //   `BEGIN
//     //       :exists := &AO.eng_part_master_api.check_part_exists(:part_no);
//     //       :objstate := &AO.part_catalog_api.get_description(:part_no);
//     //       EXCEPTION
//     //         WHEN &AO.Error_SYS.Err_Security_Checkpoint THEN
//     //           raise;
//     //         WHEN OTHERS THEN
//     //           rollback;
//     //           raise;
//     //   END;`,
//     //   { part_no: "16700171", objstate: "", exists: "" }
//     // );
  
//     // const plsql_query = await ifs_client.PlSql(
//     //   `DECLARE
//     //       attr_ VARCHAR2(2000);
//     //   BEGIN
//     //       &AO.Client_SYS.Add_To_Attr('TEST1', 'Attr1', attr_);
//     //       &AO.Client_SYS.Add_To_Attr('TEST2', 'Attr2', attr_);
//     //       &AO.Client_SYS.Add_To_Attr('TEST3', 'Attr3', attr_);
//     //       &AO.Client_SYS.Set_Item_Value('QTY', 10, attr_);
//     //       :objstate := attr_;
//     //   END;`,
//     //   { objstate: "" }
//     // );
  
//     const parts = "123,321,456,654";
  
//     const plsql_query = await ifs_client.PlSql(
//       `DECLARE
//           TYPE PartNumbers IS TABLE OF NUMBER;
//           part_numbers PartNumbers := PartNumbers();
//           attr_ VARCHAR2(2000) := '';
//       BEGIN
//           SELECT TO_NUMBER(REGEXP_SUBSTR(:parts, '[^,]+', 1, LEVEL))
//           BULK COLLECT INTO part_numbers
//           FROM DUAL
//           CONNECT BY REGEXP_SUBSTR(:parts, '[^,]+', 1, LEVEL) IS NOT NULL;
  
//           FOR i IN 1..part_numbers.COUNT LOOP
//               attr_ := attr_ || part_numbers(i) || ';';
//           END LOOP;
  
//           :objstate := attr_;
//       END;`,
//       { objstate: "", parts }
//     );
  
//     if (!sql_query.ok) {
//       throw Error(sql_query.errorText);
//     }
  
//     if (!plsql_query.ok) {
//       throw Error(sql_query.errorText);
//     }
  
//     console.log(plsql_query.bindings);
//     console.log(sql_query.result);
  
//     await ifs_connection.close();
//   };
  
//   const ifs_test = async () => {
//     const ifs_connection = new IFSConnection(ifs_config);
  
//     const ifs_client = await ifs_connection.instance();
  
//     const parts = "123,321,456,654";
  
//     const plsql_query = await ifs_client.PlSql(
//       `DECLARE
//           TYPE PartNumbers IS TABLE OF NUMBER;
//           part_numbers PartNumbers := PartNumbers();
//           attr_ VARCHAR2(2000) := '';
  
//           CURSOR part_cursor IS
//               SELECT TO_NUMBER(REGEXP_SUBSTR(:parts, '[^,]+', 1, LEVEL)) AS part_number
//               FROM DUAL
//               CONNECT BY REGEXP_SUBSTR(:parts, '[^,]+', 1, LEVEL) IS NOT NULL;
//           part_rec part_cursor%ROWTYPE;
  
//       BEGIN
//           OPEN part_cursor;
  
//           LOOP
//               FETCH part_cursor INTO part_rec;
//               EXIT WHEN part_cursor%NOTFOUND;
//               attr_ := attr_ || part_rec.part_number || '; ';
//           END LOOP;
  
//           CLOSE part_cursor;
  
//           :objstate := attr_;
//       END;`,
//       { objstate: "", parts }
//     );
  
//     console.log(plsql_query.bindings);
  
//     await ifs_connection.close();
//   };