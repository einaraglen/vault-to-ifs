export const Set_Net_Weight = `
    PROCEDURE Set_Net_Weight(part_ IN VARCHAR2, net_weight_ IN NUMBER ) IS
        attr_                   VARCHAR2(2000);
        info_                   VARCHAR2(2000);
        objid_                  VARCHAR2(2000);
        objversion_             VARCHAR2(2000);
        uom_for_weight_net_     VARCHAR2(50);

            CURSOR get_part(part_ IN VARCHAR2) IS
            SELECT objid, objversion, uom_for_weight_net
            FROM &AO.PART_CATALOG
            WHERE part_no = part_; 
    BEGIN

        OPEN get_part(part_);
            FETCH get_part INTO objid_, objversion_, uom_for_weight_net_;

            &AO.Client_SYS.Add_To_Attr('WEIGHT_NET', net_weight_, attr_);

            IF uom_for_weight_net_ IS NULL THEN 
                &AO.Client_SYS.Add_To_Attr('UOM_FOR_WEIGHT_NET', 'kg', attr_);
            END IF;

            &AO.PART_CATALOG_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
        CLOSE get_part;

    END Set_Net_Weight;
`