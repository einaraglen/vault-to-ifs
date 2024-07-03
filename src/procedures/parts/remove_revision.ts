import { Connection } from "@providers/ifs/internal/Connection";
import { PlSqlMultiResponse, PlSqlOneResponse } from "@providers/ifs/internal/PlSqlCommandTypes";
import { MSSQLRow } from "@providers/mssql/types";
import { IFSError } from "@utils/error";
import { convert_to_part, get_bindings, get_bind_keys } from "@utils/tools";

const plsql = `
DECLARE
  cnt_        NUMBER := 0;

  info_       VARCHAR2(2000);
  attr_       VARCHAR2(2000);
  objid_      VARCHAR2(2000);
  objversion_ VARCHAR2(2000);

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
  cnt_  := &AO.ENG_PART_STRUCTURE_API.Number_Of_Parents_(:c01, :c02, 'STD');
  :temp := cnt_;

  IF cnt_ = 0 THEN
    OPEN get_revision_object(Prefix_Part_No__(:c01), :c02);
      FETCH get_revision_object
        INTO objid_, objversion_;
    CLOSE get_revision_object;

    &AO.ENG_PART_REVISION_API.Set_To_Obsolete__(info_, objid_, objversion_, attr_, 'DO');
    &AO.ENG_PART_REVISION_API.REMOVE__(info_, objid_, objversion_, 'DO');
  END IF;
END;
`;

export const remove_revision = async (client: Connection, row: MSSQLRow) => {
  const message = convert_to_part(row);

  let bind: any = null;
  let res: PlSqlOneResponse | PlSqlMultiResponse | null = null;

  try {
    bind = get_bindings(message, get_bind_keys(plsql));
    res = await client.PlSql(plsql, { ...bind, temp: "" });
  } catch (err) {
    throw new IFSError((err as Error).message, "Remove Revision", row);
  }

  if (!res.ok) {
    throw new IFSError(res.errorText, "Remove Revision", row);
  }

  return res;
};
