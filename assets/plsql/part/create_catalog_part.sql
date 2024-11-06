PROCEDURE Create_Catalog_Part__ IS
    info_           VARCHAR2(2000);
    attr_           VARCHAR2(2000);
    objid_          VARCHAR2(2000);
    objversion_     VARCHAR2(2000);

    obj_            PART_REC;

    error_message     VARCHAR2(20000);
BEGIN
    obj_ := Get_Catalog_Part__(Get_Part_No__(:c01));

    IF obj_.found = FALSE THEN
        &AO.PART_CATALOG_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
        &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || Get_Part_No__(:c01)),  attr_);
        &AO.Client_SYS.Add_To_Attr('UNIT_CODE', :c03, attr_);
        &AO.Client_SYS.Add_To_Attr('STD_NAME_ID', '0', attr_);
        &AO.PART_CATALOG_API.New__(info_, objid_, objversion_, attr_, 'DO');
    ELSE
        IF Check_Editable__(Get_Part_No__(:c01)) THEN
            &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || Get_Part_No__(:c01)), attr_);
            &AO.PART_CATALOG_API.Modify__(info_, obj_.objid, obj_.objversion, attr_, 'DO');
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        error_message := SQLERRM;

g_error_message := 'Create_Catalog_Part__:' || error_message;
END Create_Catalog_Part__;