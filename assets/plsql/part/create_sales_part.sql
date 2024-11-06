PROCEDURE Create_Sales_Part__ IS
    info_       VARCHAR2(2000);
    attr_       VARCHAR2(2000);
    objid_      VARCHAR2(2000);
    objversion_ VARCHAR2(2000);

    obj_            PART_REC;

    error_message     VARCHAR2(20000);
BEGIN
    obj_ := Get_Sales_Part__(Get_Part_No__(:c01));

    IF obj_.found = FALSE THEN
        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.Client_SYS.Add_To_Attr('CONTRACT', g_contract_, attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_TYPE_DB', 'INV', attr_);
        &AO.Client_SYS.Add_To_Attr('PRIMARY_CATALOG_DB', 'FALSE', attr_);
        &AO.Client_SYS.Add_To_Attr('ACTIVEIND_DB', 'Y', attr_);
        &AO.Client_SYS.Add_To_Attr('BONUS_BASIS_FLAG_DB', 'N', attr_);
        &AO.Client_SYS.Add_To_Attr('BONUS_VALUE_FLAG_DB', 'N', attr_);
        &AO.Client_SYS.Add_To_Attr('CONV_FACTOR', 1, attr_);
        &AO.Client_SYS.Add_To_Attr('PRICE_CONV_FACTOR', 1, attr_);
        &AO.Client_SYS.Add_To_Attr('DATE_ENTERED', SYSDATE, attr_);
        &AO.Client_SYS.Add_To_Attr('CLOSE_TOLERANCE', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('QUICK_REGISTERED_PART_DB', 'FALSE', attr_);
        &AO.Client_SYS.Add_To_Attr('ALLOW_PARTIAL_PKG_DELIV_DB', 'TRUE', attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_NO', Get_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_DESC', NVL(:c07, 'Description does not exist in Vault for article ' || Get_Part_No__(:c01)), attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_GROUP', 'SE', attr_);
        &AO.Client_SYS.Add_To_Attr('SALES_PRICE_GROUP_ID', 'SE', attr_);
        &AO.Client_SYS.Add_To_Attr('SALES_UNIT_MEAS', :c03, attr_);
        &AO.Client_SYS.Add_To_Attr('ACTIVEIND_DB', 'Y', attr_);
        &AO.Client_SYS.Add_To_Attr('CONV_FACTOR', 1, attr_);
        &AO.Client_SYS.Add_To_Attr('COST', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('LIST_PRICE', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('PRICE_CONV_FACTOR', 1, attr_);
        &AO.Client_SYS.Add_To_Attr('PRICE_UNIT_MEAS', :c03, attr_);
        &AO.Client_SYS.Add_To_Attr('COMPANY', 'SE', attr_);
        &AO.Client_SYS.Add_To_Attr('TAXABLE_DB', 'Use sales tax', attr_);
        &AO.Client_SYS.Add_To_Attr('FEE_CODE', '1', attr_);
        &AO.Client_SYS.Add_To_Attr('CLOSE_TOLERANCE', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('PURCHASE_PART_NO', Get_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('NON_INV_PART_TYPE_DB', 'GOODS', attr_);
        &AO.Client_SYS.Add_To_Attr('SOURCING_OPTION_DB', 'INVENTORYORDER', attr_);
        &AO.Client_SYS.Add_To_Attr('USE_PRICE_INCL_TAX', &AO.fnd_boolean_api.Decode('FALSE'), attr_);
        &AO.SALES_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');
    ELSE
        IF Check_Editable__(Get_Part_No__(:c01)) THEN
            &AO.Client_SYS.Clear_Attr(attr_);
            &AO.Client_SYS.Add_To_Attr('CATALOG_DESC', NVL(:c07, 'Description does not exist in Vault for article ' || Get_Part_No__(:c01)), attr_);
            &AO.SALES_PART_API.Modify__(info_, obj_.objid, obj_.objversion, attr_, 'DO');
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        error_message := SQLERRM;

g_error_message := 'Create_Sales_Part__:' || error_message;
END Create_Sales_Part__;