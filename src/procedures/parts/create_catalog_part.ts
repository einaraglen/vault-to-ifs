import { Connection } from "../../providers/ifs/internal/Connection";
import { InMessage, get_bind_keys, get_bindings } from "../../utils";

const plsql = `
DECLARE
    cnt_ NUMBER := 0;

    info_       VARCHAR2(2000);
    attr_       VARCHAR2(2000);
    objid_      VARCHAR2(2000);
    objversion_ VARCHAR2(2000);

    c_objid_      VARCHAR2(2000);
    c_objversion_ VARCHAR2(2000);

    CURSOR check_part_catalog(part_ IN VARCHAR2) IS
        SELECT COUNT(1) FROM &AO.PART_CATALOG WHERE part_no = part_;

    CURSOR partca_get_version(part_ IN VARCHAR2) IS
        SELECT objid, objversion FROM &AO.PART_CATALOG WHERE part_no = part_;

BEGIN
    OPEN check_part_catalog(:c01);
    
    FETCH check_part_catalog
        INTO cnt_;
    CLOSE check_part_catalog;

    IF (cnt_ = 0) THEN
        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.PART_CATALOG_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
        &AO.Client_SYS.Add_To_Attr('PART_NO', :c01, attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || :c01),  attr_);
        &AO.Client_SYS.Add_To_Attr('UNIT_CODE', :c03, attr_);
        &AO.Client_SYS.Add_To_Attr('STD_NAME_ID', '0', attr_);
        &AO.PART_CATALOG_API.New__(info_, objid_, objversion_, attr_, 'DO');
    ELSE
        OPEN partca_get_version(:c01);
        
        FETCH partca_get_version
            INTO objid_, objversion_;
        CLOSE partca_get_version;
        
        -- QUERY FIX
        :temp := objid_;
        :temp := objversion_;
        
        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || :c01), attr_);
        &AO.PART_CATALOG_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
    END IF;
END;
`;

export const create_catalog_part = async (client: Connection, message: InMessage) => {
  const bind = get_bindings(message, get_bind_keys(plsql));

  const res = await client.PlSql(plsql, { ...bind, temp: "" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};
