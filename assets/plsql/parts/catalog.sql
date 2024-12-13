PROCEDURE Catalog__ IS

    info_           VARCHAR2(2000);
    attr_           VARCHAR2(2000);
    objid_          VARCHAR2(2000);
    objversion_     VARCHAR2(2000);
    prefix_         VARCHAR2(3);

    CURSOR get_catalog_obj(part_ IN VARCHAR2) IS
        SELECT * 
        FROM &AO.PART_CATALOG 
        WHERE part_no = part_;

    obj_            get_catalog_obj%ROWTYPE;

BEGIN

    OPEN get_catalog_obj(Part_Number__(:c01));

        FETCH get_catalog_obj INTO obj_;

           IF get_catalog_obj%NOTFOUND THEN
                &AO.PART_CATALOG_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');

                &AO.Client_SYS.Add_To_Attr('PART_NO', Part_Number__(:c01), attr_);
                &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'MISSING'), attr_);
                &AO.Client_SYS.Add_To_Attr('UNIT_CODE', :c03, attr_);
                &AO.Client_SYS.Add_To_Attr('STD_NAME_ID', '0', attr_);

                IF LENGTH(:c25) != 0 THEN
                    &AO.Client_SYS.Add_To_Attr('UOM_FOR_WEIGHT_NET', 'kg', attr_);
                    &AO.Client_SYS.Add_To_Attr('WEIGHT_NET', :c25, attr_);
                END IF;

                IF SUBSTR(Part_Number__(:c01), 1, 1) != '1' AND SUBSTR(:c03, 1, 1) != 'm' THEN
                    &AO.Client_SYS.Add_To_Attr('ALLOW_AS_NOT_CONSUMED_DB', 'TRUE', attr_);
                    &AO.Client_SYS.Add_To_Attr('ENG_SERIAL_TRACKING_CODE_DB', 'SERIAL TRACKING', attr_);
                END IF;
            
                &AO.PART_CATALOG_API.New__(info_, objid_, objversion_, attr_, 'DO');
            ELSE
                IF LENGTH(:c25) != 0 THEN
                    &AO.Client_SYS.Add_To_Attr('UOM_FOR_WEIGHT_NET', 'kg', attr_);
                    &AO.Client_SYS.Add_To_Attr('WEIGHT_NET', :c25, attr_);
                END IF;

                prefix_ := SUBSTR(Part_Number__(:c01), 1, 3);

                IF prefix_ = '160' OR prefix_ != '161' OR prefix_ = 'SE2' OR prefix_ = 'SEM' THEN
                    &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'MISSING'), attr_);
                END IF;

                IF SUBSTR(Part_Number__(:c01), 1, 1) != '1' AND SUBSTR(obj_.unit_code, 1, 1) != 'm' THEN
                    &AO.Client_SYS.Add_To_Attr('ALLOW_AS_NOT_CONSUMED_DB', 'TRUE', attr_);
                    &AO.Client_SYS.Add_To_Attr('ENG_SERIAL_TRACKING_CODE_DB', 'SERIAL TRACKING', attr_);
                END IF;
                
                &AO.PART_CATALOG_API.Modify__(info_, obj_.objid, obj_.objversion, attr_, 'DO');
            END IF;

    CLOSE get_catalog_obj;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20002, 'CatalogPart' || CHR(10) ||SQLERRM);
 
END Catalog__;