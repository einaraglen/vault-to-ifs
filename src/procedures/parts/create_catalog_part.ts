import { Connection } from "../../providers/ifs/internal/Connection";
import { PlSqlMultiResponse, PlSqlOneResponse } from "../../providers/ifs/internal/PlSqlCommandTypes";
import { IFSError } from "../../utils/error";
import { convert_to_part, ExportPart, get_bind_keys, get_bindings } from "../../utils/tools";

const plsql = `
DECLARE
    cnt_ NUMBER := 0;

    info_           VARCHAR2(2000);
    attr_           VARCHAR2(2000);
    objid_          VARCHAR2(2000);
    objversion_     VARCHAR2(2000);

    objstate_       VARCHAR2(200);

    c_objid_        VARCHAR2(2000);
    c_objversion_   VARCHAR2(2000);

    uom_            VARCHAR2(200);

    CURSOR check_part_catalog(part_ IN VARCHAR2) IS
        SELECT COUNT(1) FROM &AO.PART_CATALOG WHERE part_no = part_;

    CURSOR partca_get_version(part_ IN VARCHAR2) IS
        SELECT objid, objversion FROM &AO.PART_CATALOG WHERE part_no = part_;

    CURSOR get_catalog_uom(part_ IN VARCHAR2) IS
        SELECT unit_code
        FROM &AO.PART_CATALOG
        WHERE part_no = part_;

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
    OPEN check_part_catalog(Prefix_Part_No__(:c01));
    
    FETCH check_part_catalog
        INTO cnt_;
    CLOSE check_part_catalog;

    IF (cnt_ = 0) THEN
        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.PART_CATALOG_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
        &AO.Client_SYS.Add_To_Attr('PART_NO', Prefix_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || Prefix_Part_No__(:c01)),  attr_);
        &AO.Client_SYS.Add_To_Attr('UNIT_CODE', :c03, attr_);
        &AO.Client_SYS.Add_To_Attr('STD_NAME_ID', '0', attr_);
        &AO.PART_CATALOG_API.New__(info_, objid_, objversion_, attr_, 'DO');
    ELSE
        IF SUBSTR(Prefix_Part_No__(:c01), 1, 2) LIKE '16' 
        AND SUBSTR(Prefix_Part_No__(:c01), 1, 3) NOT LIKE '166' THEN

            OPEN partca_get_version(Prefix_Part_No__(:c01));
            
            FETCH partca_get_version
                INTO objid_, objversion_;
            CLOSE partca_get_version;

            --objstate_   := IFSAPP.Eng_Part_Revision_API.Get_Obj_State(:c02, :c03);
            
            -- QUERY FIX
            :temp := objid_;
            :temp := objversion_;
            
            &AO.Client_SYS.Clear_Attr(attr_);
            
            &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || Prefix_Part_No__(:c01)), attr_);

            &AO.PART_CATALOG_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
        END IF;

        OPEN get_catalog_uom(Prefix_Part_No__(:c01));
            FETCH get_catalog_uom
                INTO uom_;
        CLOSE get_catalog_uom;
    END IF;

    :unit := uom_;
END;
`;

export const create_catalog_part = async (client: Connection, row: ExportPart) => {
  const message = convert_to_part(row);

  let bind: any = null;
  let res: PlSqlOneResponse | PlSqlMultiResponse | null = null;

  try {
    bind = get_bindings(message, get_bind_keys(plsql));
    res = await client.PlSql(plsql, { ...bind, temp: "", unit: "" });
  } catch (err) {
    throw new IFSError((err as Error).message, "Create Engineering Part", row);
  }

  if (!res.ok) {
    throw new IFSError(res.errorText, "Create Catalog Part", row);
  }

  return res;
};
