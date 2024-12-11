PROCEDURE Purchase__ IS

    info_           VARCHAR2(2000);
    attr_           VARCHAR2(2000);
    objid_          VARCHAR2(2000);
    objversion_     VARCHAR2(2000);

    CURSOR get_purchase_obj(part_ IN VARCHAR2) IS
        SELECT * 
        FROM &AO.PURCHASE_PART 
        WHERE part_no = part_;

    obj_            get_purchase_obj%ROWTYPE;

BEGIN

    OPEN get_purchase_obj(Part_Number__(:c01));

        FETCH get_purchase_obj INTO obj_;

            IF get_purchase_obj%NOTFOUND THEN
                &AO.PURCHASE_PART_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
                &AO.Client_SYS.Add_To_Attr('PART_NO', Part_Number__(:c01), attr_);

                &AO.Client_SYS.Add_To_Attr('DESCRIPTION', 'Purchase Part', attr_);

                &AO.Client_SYS.Add_To_Attr('INVENTORY_FLAG_DB', 'Y', attr_);
                &AO.Client_SYS.Add_To_Attr('DEFAULT_BUY_UNIT_MEAS', &AO.PART_CATALOG_API.Get(Part_Number__(:c01)).unit_code, attr_);
                &AO.Client_SYS.Add_To_Attr('TAXABLE', 'False', attr_);
                &AO.Client_SYS.Set_Item_Value('CONTRACT', 'SE', attr_);
                &AO.PURCHASE_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');
            END IF;

    CLOSE get_purchase_obj;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20002, 'PurchasePart' || CHR(10) ||SQLERRM);

END Purchase__;