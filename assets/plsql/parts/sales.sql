-- NEW
IFSAPP.Client_SYS.Add_To_Attr('CONTRACT', 'SE', attr_);
IFSAPP.Client_SYS.Add_To_Attr('CATALOG_TYPE_DB', 'INV', attr_);
IFSAPP.Client_SYS.Add_To_Attr('PRIMARY_CATALOG_DB', 'FALSE', attr_);
IFSAPP.Client_SYS.Add_To_Attr('ACTIVEIND_DB', 'Y', attr_);
IFSAPP.Client_SYS.Add_To_Attr('BONUS_BASIS_FLAG_DB', 'N', attr_);
IFSAPP.Client_SYS.Add_To_Attr('BONUS_VALUE_FLAG_DB', 'N', attr_);
IFSAPP.Client_SYS.Add_To_Attr('CONV_FACTOR', 1, attr_);
IFSAPP.Client_SYS.Add_To_Attr('PRICE_CONV_FACTOR', 1, attr_);
IFSAPP.Client_SYS.Add_To_Attr('DATE_ENTERED', SYSDATE, attr_);
IFSAPP.Client_SYS.Add_To_Attr('CLOSE_TOLERANCE', 0, attr_);
IFSAPP.Client_SYS.Add_To_Attr('QUICK_REGISTERED_PART_DB', 'FALSE', attr_);
IFSAPP.Client_SYS.Add_To_Attr('ALLOW_PARTIAL_PKG_DELIV_DB', 'TRUE', attr_);
IFSAPP.Client_SYS.Add_To_Attr('CATALOG_NO', Prefix_Part_No__(rec_.c01), attr_);
IFSAPP.Client_SYS.Add_To_Attr('PART_NO', Prefix_Part_No__(rec_.c01), attr_);

-- TODO: Keep this as some generic desc since main will be from CATALOG?
IFSAPP.Client_SYS.Add_To_Attr('CATALOG_DESC', 'Sales Part', attr_);

IFSAPP.Client_SYS.Add_To_Attr('CATALOG_GROUP', 'SE', attr_);
IFSAPP.Client_SYS.Add_To_Attr('SALES_PRICE_GROUP_ID', 'SE', attr_);
IFSAPP.Client_SYS.Add_To_Attr('SALES_UNIT_MEAS', IFSAPP.PART_CATALOG_API.Get(Prefix_Part_No__(rec_.c01)).unit_code, attr_);
IFSAPP.Client_SYS.Add_To_Attr('ACTIVEIND_DB', 'Y', attr_);
IFSAPP.Client_SYS.Add_To_Attr('CONV_FACTOR', 1, attr_);
IFSAPP.Client_SYS.Add_To_Attr('COST', 0, attr_);
IFSAPP.Client_SYS.Add_To_Attr('LIST_PRICE', 0, attr_);
IFSAPP.Client_SYS.Add_To_Attr('PRICE_CONV_FACTOR', 1, attr_);
IFSAPP.Client_SYS.Add_To_Attr('PRICE_UNIT_MEAS', IFSAPP.PART_CATALOG_API.Get(Prefix_Part_No__(rec_.c01)).unit_code, attr_);
IFSAPP.Client_SYS.Add_To_Attr('COMPANY', 'SE', attr_);
IFSAPP.Client_SYS.Add_To_Attr('TAXABLE_DB', 'Use sales tax', attr_);
IFSAPP.Client_SYS.Add_To_Attr('FEE_CODE', '1', attr_);
IFSAPP.Client_SYS.Add_To_Attr('CLOSE_TOLERANCE', 0, attr_);
IFSAPP.Client_SYS.Add_To_Attr('PURCHASE_PART_NO', Prefix_Part_No__(rec_.c01), attr_);
IFSAPP.Client_SYS.Add_To_Attr('NON_INV_PART_TYPE_DB', 'GOODS', attr_);
IFSAPP.Client_SYS.Add_To_Attr('SOURCING_OPTION_DB', 'INVENTORYORDER', attr_);
IFSAPP.Client_SYS.Add_To_Attr('USE_PRICE_INCL_TAX', IFSAPP.FND_BOOLEAN_API.Decode('FALSE'), attr_);

IFSAPP.SALES_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');