import { Connection } from "../providers/ifs/internal/Connection";

export type CreateEngineeringPart = {
    part_no: string
    description: string
    unit_code: string
    std_name_id: string
    status?: "Released"
}

export const create_engineering_part = (client: Connection, bind: CreateEngineeringPart) => {
    const sql = `
        DECLARE
            info_       VARCHAR2(2000);
            attr_       VARCHAR2(2000);
            objid_      VARCHAR2(2000);
            objversion_ VARCHAR2(2000);
        BEGIN
            &AO.client_sys.clear_attr(attr_);

            &AO.client_sys.add_to_attr('PART_NO', :part_no, attr_);
            &AO.client_sys.add_to_attr('DESCRIPTION', :description, attr_);
            &AO.client_sys.add_to_attr('UNIT_CODE', :unit_code, attr_);
            &AO.client_sys.add_to_attr('STD_NAME_ID', :std_name_id, attr_);

            &AO.eng_part_master_api.new__(info_, objid_, objversion_, attr_, 'PREPARE');

            IF :status = 'Released' THEN
                UPDATE &AO.eng_part_revision_tab
                SET    ROWSTATE = 'Active'
                WHERE  part_no = :part_no
                -- AND    part_rev = rec_.c02;
            END IF;

            COMMIT

            EXCEPTION 
                WHEN &AO.error_sys.err_security_checkpoint THEN 
                    RAISE; 
                WHEN OTHERS THEN 
                    ROLLBACK; 
                    RAISE; 
        END;
    `
    return client.PlSql(sql, { ...bind });
}