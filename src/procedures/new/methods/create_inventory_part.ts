export const Create_Inventory_Part = `
    PROCEDURE Create_Inventory_Part IS
        objid_          VARCHAR2(2000);
        objversion_     VARCHAR2(2000);

        site_           VARCHAR2(50) := 'SE';
        template_       VARCHAR2(50) := 'SE1PCS';
        rev_            VARCHAR2(50);

        CURSOR get_inventory_part(part_ IN VARCHAR2) IS
            SELECT objid, objversion
            FROM   &AO.INVENTORY_PART
            WHERE  contract = 'SE'
            AND    part_no = part_;
    BEGIN

        OPEN get_inventory_part(Get_Part_No(:c01));

            FETCH get_inventory_part
                INTO objid_, objversion_;

            IF get_latest_revision%NOTFOUND THEN
                rev_:= &AO.Eng_Part_Revision_API.Get_Last_Rev(Get_Part_No(:c01));
                &AO.ENG_PART_INVENT_UTIL_API.Create_Inventory_Part(site_, Get_Part_No(:c01), site_, template_, rev_);

                Set_Mat_Cert(Get_Part_No(:c01), :c10)
                Set_Net_Weight(Get_Part_No(:c01), :c25);
            ELSE
                Set_Mat_Cert(Get_Part_No(:c01), :c10)
                Set_Net_Weight(Get_Part_No(:c01), :c25);
            END IF;

        CLOSE get_inventory_part;

    END Create_Inventory_Part;
`