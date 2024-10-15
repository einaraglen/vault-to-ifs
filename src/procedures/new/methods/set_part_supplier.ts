export const Set_Part_Supplier = `
    PROCEDURE Set_Part_Supplier IS
        info_                      VARCHAR2(2000);
        attr_                      VARCHAR2(2000);
        objid_                     VARCHAR2(2000);
        objversion_                VARCHAR2(2000);

        supplier_id_               VARCHAR2(100);

        supplier_added_            NUMBER := 0;
        supplier_part_added_       NUMBER := 0;

        CURSOR get_supplier(supplier_ IN VARCHAR2) IS
            SELECT manufacturer_id
            FROM &AO.MANUFACTURER_INFO 
            WHERE (LOWER(name) LIKE '%' || LOWER(supplier_) || '%');

        CURSOR check_supplier(part_ IN VARCHAR2, man_no_ IN VARCHAR2) IS
            SELECT COUNT(1) 
            FROM &AO.PART_MANUFACTURER 
            WHERE part_no = part_ 
            AND man_no_ = manufacturer_no;

        CURSOR check_supplier_part(part_ IN VARCHAR2, man_no_ VARCHAR2, man_part_no_ VARCHAR2) IS
            SELECT COUNT(1) 
            FROM &AO.PART_MANU_PART_NO 
            WHERE part_no = part_ 
            AND man_no_ = manufacturer_no
            AND man_part_no_ = manu_part_no;
   
    BEGIN
        IF :c22 LIKE '' THEN
            RETURN;
        END IF;

        OPEN get_supplier(:c16);
        
            FETCH get_supplier
                INTO supplier_id_;

            IF get_supplier%FOUND THEN

                OPEN check_supplier(Get_Part_No(:c01), supplier_id_);
                    FETCH check_supplier
                        INTO supplier_added_;
                CLOSE check_supplier;

                OPEN check_supplier_part(Get_Part_No(:c01), supplier_id_, :c22);
                    FETCH check_supplier_part
                        INTO supplier_part_added_;
                CLOSE check_supplier_part;

                IF supplier_added_ = 0 THEN 
                    &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No(:c01), attr_);
                    &AO.Client_SYS.Add_To_Attr('MANUFACTURER_NO', supplier_id_, attr_);
                    &AO.Client_SYS.Add_To_Attr('PREFERRED_MANUFACTURER_DB', 'TRUE', attr_); 

                    &AO.PART_MANUFACTURER_API.New__(info_, objid_, objversion_, attr_, 'DO');
                END IF;

                IF supplier_part_added_ = 0 THEN
                    &AO.Client_SYS.Clear_Attr(attr_);

                    info_ := NULL;
                    objid_ := NULL;
                    objversion_ := NULL;

                    &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No(:c01), attr_);
                    &AO.Client_SYS.Add_To_Attr('MANUFACTURER_NO', supplier_id_, attr_);
                    &AO.Client_SYS.Add_To_Attr('MANU_PART_NO', :c22, attr_);
                    &AO.Client_SYS.Add_To_Attr('APPROVED', 'Yes', attr_);
                    &AO.Client_SYS.Add_To_Attr('APPROVED_NOTE', 'VAULT_IMPORT', attr_);

                    &AO.PART_MANU_PART_NO_API.New__(info_, objid_, objversion_, attr_, 'DO');

                    &AO.PART_MANU_PART_NO_API.Set_Preferred_Manu_Part(Get_Part_No(:c01), supplier_id_, :c22);
                END IF;

            END IF;
            
        CLOSE get_supplier;

    END Set_Part_Supplier;
`