PROCEDURE Create_Purchase_Part__ IS
    info_       VARCHAR2(2000);
    attr_       VARCHAR2(2000);
    objid_      VARCHAR2(2000);
    objversion_ VARCHAR2(2000);

    obj_            PART_REC;

    error_message     VARCHAR2(20000);
BEGIN
    -- TODO: fix this to get Purchase Part
    obj_ := Get_Purchase_Part__(Get_Part_No__(:c01));

    IF obj_.found = FALSE THEN
        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.PURCHASE_PART_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
        &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || Get_Part_No__(:c01)), attr_);
        &AO.Client_SYS.Add_To_Attr('INVENTORY_FLAG_DB', 'Y', attr_);
        &AO.Client_SYS.Add_To_Attr('DEFAULT_BUY_UNIT_MEAS', :c03, attr_);
        &AO.Client_SYS.Add_To_Attr('TAXABLE', 'False', attr_);
        &AO.Client_SYS.Set_Item_Value('CONTRACT', g_contract_, attr_);
        &AO.PURCHASE_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');
    ELSE
        IF Check_Editable__(Get_Part_No__(:c01)) THEN
            &AO.Client_SYS.Clear_Attr(attr_);
            &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || Get_Part_No__(:c01)),  attr_);
            &AO.PURCHASE_PART_API.Modify__(info_, obj_.objid, obj_.objversion, attr_, 'DO');
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        error_message := SQLERRM;

g_error_message := 'Create_Purchase_Part__:' || error_message;
END Create_Purchase_Part__;