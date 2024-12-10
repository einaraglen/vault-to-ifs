PROCEDURE Sales__ IS

    info_           VARCHAR2(2000);
    attr_           VARCHAR2(2000);
    objid_          VARCHAR2(2000);
    objversion_     VARCHAR2(2000);

    CURSOR get_sales_obj(part_ IN VARCHAR2) IS
        SELECT * 
        FROM &AO.SALES_PART 
        WHERE part_no = part_;

    obj_            get_sales_obj%ROWTYPE;

BEGIN

    OPEN get_sales_obj(Part_Number__(:c01));

        FETCH get_sales_obj INTO obj_;

            IF get_sales_obj%NOTFOUND THEN
                &AO.Client_SYS.Add_To_Attr('CONTRACT', 'SE', attr_);
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
                &AO.Client_SYS.Add_To_Attr('CATALOG_NO', Part_Number__(:c01), attr_);
                &AO.Client_SYS.Add_To_Attr('PART_NO', Part_Number__(:c01), attr_);

                &AO.Client_SYS.Add_To_Attr('CATALOG_DESC', 'Sales Part', attr_);

                &AO.Client_SYS.Add_To_Attr('CATALOG_GROUP', 'SE', attr_);
                &AO.Client_SYS.Add_To_Attr('SALES_PRICE_GROUP_ID', 'SE', attr_);
                &AO.Client_SYS.Add_To_Attr('SALES_UNIT_MEAS', &AO.PART_CATALOG_API.Get(Part_Number__(:c01)).unit_code, attr_);
                &AO.Client_SYS.Add_To_Attr('ACTIVEIND_DB', 'Y', attr_);
                &AO.Client_SYS.Add_To_Attr('CONV_FACTOR', 1, attr_);
                &AO.Client_SYS.Add_To_Attr('COST', 0, attr_);
                &AO.Client_SYS.Add_To_Attr('LIST_PRICE', 0, attr_);
                &AO.Client_SYS.Add_To_Attr('PRICE_CONV_FACTOR', 1, attr_);
                &AO.Client_SYS.Add_To_Attr('PRICE_UNIT_MEAS', &AO.PART_CATALOG_API.Get(Part_Number__(:c01)).unit_code, attr_);
                &AO.Client_SYS.Add_To_Attr('COMPANY', 'SE', attr_);
                &AO.Client_SYS.Add_To_Attr('TAXABLE_DB', 'Use sales tax', attr_);
                &AO.Client_SYS.Add_To_Attr('FEE_CODE', '1', attr_);
                &AO.Client_SYS.Add_To_Attr('CLOSE_TOLERANCE', 0, attr_);
                &AO.Client_SYS.Add_To_Attr('PURCHASE_PART_NO', Part_Number__(:c01), attr_);
                &AO.Client_SYS.Add_To_Attr('NON_INV_PART_TYPE_DB', 'GOODS', attr_);
                &AO.Client_SYS.Add_To_Attr('SOURCING_OPTION_DB', 'INVENTORYORDER', attr_);
                &AO.Client_SYS.Add_To_Attr('USE_PRICE_INCL_TAX', &AO.FND_BOOLEAN_API.Decode('FALSE'), attr_);

                &AO.SALES_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');
            END IF;

    CLOSE get_sales_obj;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20002, 'SalesPart' || CHR(10) ||SQLERRM);

END Sales__;