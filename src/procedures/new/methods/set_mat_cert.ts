export const Set_Mat_Cert = `
    PROCEDURE Set_Mat_Cert(part_ IN VARCHAR2, cert_ IN VARCHAR2) IS
        info_           VARCHAR2(2000);
        objid_          VARCHAR2(2000);
        objversion_     VARCHAR2(2000);
        attr_           VARCHAR2(2000);

        CURSOR get_inventory_part(part_ IN VARCHAR2) IS
                SELECT objid, objversion
                FROM &AO.INVENTORY_PART
                WHERE contract = 'SE'
                AND part_no = part_;
    BEGIN
        OPEN get_inventory_part(part_);

            FETCH get_inventory_part
                INTO objid_, objversion_;

            IF cert_ = '3.1' THEN
                &AO.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
            ELSIF cert_ = '3.2' THEN
                &AO.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT32', attr_);
            ELSIF cert_ = '2.2' THEN
                &AO.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT22', attr_);
            END IF;

            &AO.INVENTORY_PART_API.Modify__(info_, objid_, objversion_, attr_, 'DO');

        CLOSE get_inventory_part;
    END Set_Mat_Cert;
`