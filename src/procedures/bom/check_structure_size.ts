import { Connection } from "../../providers/ifs/internal/Connection";
import { PlSqlMultiResponse, PlSqlOneResponse } from "../../providers/ifs/internal/PlSqlCommandTypes";
import { IFSError } from "../../utils/error";
import { ExportPart } from "../../utils/tools";

const plsql = `
DECLARE
  cnt_      NUMBER;

  CURSOR count_sub_structure(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2) IS
    SELECT 
        COUNT(*)
    FROM 
        &AO.ENG_PART_STRUCTURE_EXT_CFV EPS
    START WITH 
        EPS.PART_NO = part_no_
        AND EPS.PART_REV = part_rev_
    CONNECT BY 
        PRIOR EPS.SUB_PART_NO = EPS.PART_NO
        AND PRIOR EPS.SUB_PART_REV = EPS.PART_REV;

    FUNCTION Prefix_Part_No__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefixed_part_no_ VARCHAR2(100);
        prefix_           VARCHAR2(5) := 'SE';
    BEGIN
        IF SUBSTR(part_no_, 1, 1) = '1' OR SUBSTR(part_no_, 1, 2) = 'PD' THEN
            prefixed_part_no_ := part_no_;
        ELSE
            prefixed_part_no_ := prefix_ || part_no_;
        END IF;
        RETURN(prefixed_part_no_);
    END Prefix_Part_No__;
BEGIN
    OPEN count_sub_structure(Prefix_Part_No__(:p0), :p1);
        FETCH count_sub_structure INTO cnt_;
    CLOSE count_sub_structure;

    :temp := cnt_;
END;
`;

export const check_structure_size = async (client: Connection, root: ExportPart) => {
    let bind: any = null;
    let res: PlSqlOneResponse | PlSqlMultiResponse | null = null;

   
    try {
      res = await client.PlSql(plsql, { p0: root.partNumber, p1: root.revision, temp: 0 });
    } catch (err) {
      throw new IFSError((err as Error).message, "Check Structure Size", root)
    }
  
    if (!res.ok) {
      throw new IFSError(res.errorText, "Check Structure Size", root);
    }
  
    return res.bindings.temp;
  };