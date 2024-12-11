-- UN USED!!
DECLARE
    info_                      VARCHAR2(2000);
    attr_                      VARCHAR2(2000);
    objid_                     VARCHAR2(2000);
    objversion_                VARCHAR2(2000);
    manufacturer_id_           VARCHAR2(100);
    name_                      VARCHAR2(100);

    manufacturer_check_        NUMBER := 0;
    manufacturer_part_check_   NUMBER := 0;

    CURSOR check_manufacturer(part_ IN VARCHAR2, man_no_ IN VARCHAR2) IS
        SELECT COUNT(1) FROM &AO.PART_MANUFACTURER WHERE part_no = part_ AND man_no_ = manufacturer_no;

    CURSOR check_manufacturer_part(part_ IN VARCHAR2, man_no_ VARCHAR2, man_part_no_ VARCHAR2) IS
        SELECT COUNT(1) FROM &AO.PART_MANU_PART_NO WHERE part_no = part_ AND man_no_ = manufacturer_no AND man_part_no_ = manu_part_no;

    CURSOR get_manufacturer(vendor_ IN VARCHAR2) IS
        SELECT manufacturer_id, name FROM &AO.MANUFACTURER_INFO WHERE (name LIKE '%' || vendor_ || '%');

    FUNCTION Prefix_Part_No__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefixed_part_no_ VARCHAR2(100);
        prefix_           VARCHAR2(5) := 'SE';
    BEGIN
        IF SUBSTR(part_no_, 1, 1) = '1' OR SUBSTR(part_no_, 1, 2) = 'PD' THEN
            prefixed_part_no_ := part_no_;
        ELSE
            prefixed_part_no_ := prefix_ || part_no_;
        END IF;
        RETURN(prefixed_part_no_);
    END Prefix_Part_No__;

BEGIN
    IF :c16 IS NULL OR :c16 = '' OR :c22 IS NULL OR :c22 = '' THEN
        RETURN; 
    END IF;
 
    OPEN get_manufacturer(:c16);
    
    FETCH get_manufacturer
        INTO manufacturer_id_, name_;

        OPEN check_manufacturer(Prefix_Part_No__(:c01), manufacturer_id_);
            FETCH check_manufacturer
                INTO manufacturer_check_;
        CLOSE check_manufacturer;

        OPEN check_manufacturer_part(Prefix_Part_No__(:c01), manufacturer_id_, :c22);
            FETCH check_manufacturer_part
                INTO manufacturer_part_check_;
        CLOSE check_manufacturer_part;

        IF get_manufacturer%FOUND THEN
            IF manufacturer_check_ = 0 THEN 
                &AO.Client_SYS.Add_To_Attr('PART_NO', Prefix_Part_No__(:c01), attr_);
                &AO.Client_SYS.Add_To_Attr('MANUFACTURER_NO', manufacturer_id_, attr_);
                &AO.Client_SYS.Add_To_Attr('PREFERRED_MANUFACTURER_DB', 'TRUE', attr_); 

                &AO.PART_MANUFACTURER_API.New__(info_, objid_, objversion_, attr_, 'DO');
            END IF;

            IF manufacturer_part_check_ = 0 THEN
                &AO.Client_SYS.Clear_Attr(attr_);

                &AO.Client_SYS.Add_To_Attr('PART_NO', Prefix_Part_No__(:c01), attr_);
                &AO.Client_SYS.Add_To_Attr('MANUFACTURER_NO', manufacturer_id_, attr_);
                &AO.Client_SYS.Add_To_Attr('MANU_PART_NO', :c22, attr_);
                &AO.Client_SYS.Add_To_Attr('APPROVED', 'Yes', attr_);
                &AO.Client_SYS.Add_To_Attr('APPROVED_NOTE', 'VAULT_IMPORT', attr_);

                &AO.PART_MANU_PART_NO_API.New__(info_, objid_, objversion_, attr_, 'DO');

                &AO.PART_MANU_PART_NO_API.Set_Preferred_Manu_Part(Prefix_Part_No__(:c01), manufacturer_id_, :c22);
            END IF;
        END IF;

    CLOSE get_manufacturer;

    -- QUERY FIX
    :temp := manufacturer_id_;
END;