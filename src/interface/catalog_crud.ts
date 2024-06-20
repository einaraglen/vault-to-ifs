import { Connection } from "../providers/ifs/internal/Connection";

const create_plsql = `
    DECLARE
        cnt_ NUMBER := 0;

        info_       VARCHAR2(2000);
        attr_       VARCHAR2(2000);
        objid_      VARCHAR2(2000);
        objversion_ VARCHAR2(2000);

    BEGIN
        &AO.client_sys.clear_attr(attr_);

        &AO.part_catalog_api.new__(info_, objid_, objversion_, attr_, 'PREPARE');

        &AO.client_sys.add_to_attr('PART_NO', :part_no, attr_);
        &AO.client_sys.add_to_attr('DESCRIPTION', :description, attr_);
        &AO.client_sys.add_to_attr('UNIT_CODE', 'PCS', attr_);

        &AO.part_catalog_api.new__(info_, objid_, objversion_, attr_, 'DO');
    END;
`;

export const catalog_create = async (client: Connection, bind: any) => {
  const res = await client.PlSql(create_plsql, { ...bind });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};

const modify_plsql = `
    DECLARE
        cnt_ NUMBER := 0;

        info_       VARCHAR2(2000);
        attr_       VARCHAR2(2000);
        objid_      VARCHAR2(2000);
        objversion_ VARCHAR2(2000);

        CURSOR get_part_id(part_ IN VARCHAR2) IS
            SELECT objid, objversion FROM &AO.part_catalog WHERE part_no = part_;

    BEGIN
        OPEN get_part_id(:part_no);

        FETCH get_part_id
            INTO objid_, objversion_;
        CLOSE get_part_id;

        :objid := objid_;
        :objversion := objversion_;

        &AO.client_sys.clear_attr(attr_);

        &AO.client_sys.add_to_attr('DESCRIPTION', :description, attr_);

        &AO.part_catalog_api.modify__(info_, objid_, objversion_, attr_, 'DO');
    END;
`;

export const catalog_modify = async (client: Connection, bind: any) => {
  const res = await client.PlSql(modify_plsql, { ...bind });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};

const remove_plsql = `
    DECLARE
        cnt_ NUMBER := 0;

        info_       VARCHAR2(2000);
        attr_       VARCHAR2(2000);
        objid_      VARCHAR2(2000);
        objversion_ VARCHAR2(2000);

        CURSOR get_part_id(part_ IN VARCHAR2) IS
            SELECT objid, objversion FROM &AO.part_catalog WHERE part_no = part_;

    BEGIN
        OPEN get_part_id(:part_no);

        FETCH get_part_id
            INTO objid_, objversion_;
        CLOSE get_part_id;

        :objid := objid_;
        :objversion := objversion_;

        &AO.part_catalog_api.remove__(info_, objid_, objversion_, attr_);
    END;
`;

export const catalog_remove = async (client: Connection, bind: any) => {
  const res = await client.PlSql(remove_plsql, { ...bind });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};
