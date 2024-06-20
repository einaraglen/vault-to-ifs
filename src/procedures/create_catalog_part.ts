import { Connection } from "../providers/ifs/internal/Connection";

const plsql = `
DECLARE
    cnt_ NUMBER := 0;

    info_       VARCHAR2(2000);
    attr_       VARCHAR2(2000);
    objid_      VARCHAR2(2000);
    objversion_ VARCHAR2(2000);

    CURSOR check_if_exists(part_ IN VARCHAR2) IS
        SELECT COUNT(1) FROM &AO.part_catalog WHERE part_no = part_;

    CURSOR get_part_id(part_ IN VARCHAR2) IS
        SELECT objid, objversion FROM &AO.part_catalog WHERE part_no = part_;

BEGIN
    OPEN check_if_exists(:part_no);
    
    FETCH check_if_exists
        INTO cnt_;
    CLOSE check_if_exists;

    IF (cnt_ = 0) THEN
        &AO.client_sys.clear_attr(attr_);

        &AO.part_catalog_api.new__(info_, objid_, objversion_, attr_, 'PREPARE');

        &AO.client_sys.add_to_attr('PART_NO', :part_no, attr_);
        &AO.client_sys.add_to_attr('DESCRIPTION', :description, attr_);
        &AO.client_sys.add_to_attr('UNIT_CODE', 'PCS', attr_);

        &AO.part_catalog_api.new__(info_, objid_, objversion_, attr_, 'DO');
    ELSE
        OPEN get_part_id(:part_no);

        FETCH get_part_id
            INTO objid_, objversion_;
        CLOSE get_part_id;

        :objid := objid_;
        :objversion := objversion_;

        &AO.client_sys.clear_attr(attr_);

        &AO.client_sys.add_to_attr('DESCRIPTION', :description, attr_);

        &AO.part_catalog_api.modify__(info_, objid_, objversion_, attr_, 'DO');
    END IF;
END;
`;

export const create_catalog_part = async (client: Connection, bind: any) => {
  const res = await client.PlSql(plsql, { ...bind });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};
