DECLARE
    contract_   VARCHAR2(20) := 'SE';
    cnt_        NUMBER := 0;

    info_       VARCHAR2(2000);
    attr_       VARCHAR2(2000);
    objid_      VARCHAR2(2000);
    objversion_ VARCHAR2(2000);

    CURSOR check_sales_part(part_ IN VARCHAR2, contr_ IN VARCHAR2) IS
        SELECT COUNT(1)
        FROM   &AO.sales_part
        WHERE  catalog_no = part_
        AND    contract = contr_;

    CURSOR sales_part_get_version(part_ IN VARCHAR2) IS
        SELECT objid, objversion
        FROM   &AO.sales_part
        WHERE  contract = contract_
        AND    catalog_no = part_;

    FUNCTION Prefix_Part_No__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefixed_part_no_ VARCHAR2(100);
        prefix_           VARCHAR2(5) := 'SE';
    BEGIN
        IF ((part_no_ IS NULL) OR (SUBSTR(part_no_, 1, LENGTH(prefix_)) = prefix_) OR ((LENGTH(part_no_) = 7) AND (SUBSTR(part_no_, 1, 1) != '2')) OR (LENGTH(part_no_) != 7)) THEN
            prefixed_part_no_ := part_no_;
        ELSE
            prefixed_part_no_ := prefix_ || part_no_;
        END IF;
        RETURN(prefixed_part_no_);
    END Prefix_Part_No__;

BEGIN
    OPEN check_sales_part(Prefix_Part_No__(:c01), contract_);

    FETCH check_sales_part
        INTO cnt_;
    CLOSE check_sales_part;

    IF (cnt_ = 0) THEN
        &AO.Client_SYS.Clear_Attr(attr_);
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
        &AO.Client_SYS.Add_To_Attr('CATALOG_NO', Prefix_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('PART_NO', Prefix_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_DESC', NVL(:c07, 'Description does not exist in Vault for article ' || Prefix_Part_No__(:c01)), attr_);
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
        &AO.Client_SYS.Add_To_Attr('PURCHASE_PART_NO', Prefix_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('NON_INV_PART_TYPE_DB', 'GOODS', attr_);
        &AO.Client_SYS.Add_To_Attr('SOURCING_OPTION_DB', 'INVENTORYORDER', attr_);
        &AO.Client_SYS.Add_To_Attr('USE_PRICE_INCL_TAX', &AO.fnd_boolean_api.Decode('FALSE'), attr_);
        &AO.SALES_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');
    ELSE
        OPEN sales_part_get_version(Prefix_Part_No__(:c01));
        FETCH sales_part_get_version
            INTO objid_, objversion_;
        CLOSE sales_part_get_version;

        -- QUERY FIX
        :temp := objid_;
        :temp := objversion_;

        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_DESC', NVL(:c07, 'Description does not exist in Vault for article ' || Prefix_Part_No__(:c01)), attr_);
        &AO.SALES_PART_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
    END IF;
END;