import { convert_to_part, ExportPart, get_bind_keys, get_bindings } from "../../utils/tools";
import { PlSqlMultiResponse, PlSqlOneResponse } from "../../providers/ifs/internal/PlSqlCommandTypes";
import { Connection } from "../../providers/ifs/internal/Connection";
import { IFSError } from "../../utils/error";

const plsql = `
DECLARE
  info_               VARCHAR2(2000);
  attr_               VARCHAR2(2000);
  objid_              VARCHAR2(2000);
  objversion_         VARCHAR2(2000);
  objstate_           VARCHAR2(200);

    CURSOR get_revision_object(p_part_no_ IN VARCHAR2, p_part_rev_ IN VARCHAR2) IS
        SELECT objid, objversion
        FROM   &AO.ENG_PART_REVISION
        WHERE  part_no = p_part_no_
        AND    part_rev = p_part_rev_;

  FUNCTION Prefix_Part_No__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
      prefixed_part_no_ VARCHAR2(100);
      prefix_           VARCHAR2(5) := 'SE';
  BEGIN
      IF ((part_no_ IS NULL) OR (SUBSTR(part_no_, 1, LENGTH(prefix_)) = prefix_) OR ((LENGTH(part_no_) = 7) AND (SUBSTR(part_no_, 1, 1) != '2')) OR (LENGTH(part_no_) != 7)) THEN
          prefixed_part_no_ := part_no_;
      ELSE
          prefixed_part_no_ := prefix_ || part_no_;
      END IF;
      RETURN(prefixed_part_no_);
  END Prefix_Part_No__;

BEGIN
    objstate_   := &AO.Eng_Part_Revision_API.Get_Obj_State(Prefix_Part_No__(:c01), :c02);
    :state       := objstate_;
END;
`;

export const check_part_state = async (client: Connection, row: ExportPart) => {
    const message = convert_to_part(row);
    
    let bind: any = null;
    let res: PlSqlOneResponse | PlSqlMultiResponse | null = null;
  
    try {
      bind = get_bindings(message, get_bind_keys(plsql));
      res = await client.PlSql(plsql, { ...bind, state: "" });
    } catch (err) {
      throw new IFSError((err as Error).message, "Check Part State", row)
    }
  
    if (!res.ok) {
      throw new IFSError(res.errorText, "Check Part State", row);
    }
  
    return res;
  };