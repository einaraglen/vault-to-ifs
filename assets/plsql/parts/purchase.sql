-- NEW
IFSAPP.PURCHASE_PART_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
IFSAPP.Client_SYS.Add_To_Attr('PART_NO', Prefix_Part_No__(rec_.c01), attr_);

-- TODO: Keep this as some generic desc since main will be from CATALOG?
IFSAPP.Client_SYS.Add_To_Attr('DESCRIPTION', 'Purchase Part', attr_);

IFSAPP.Client_SYS.Add_To_Attr('INVENTORY_FLAG_DB', 'Y', attr_);
IFSAPP.Client_SYS.Add_To_Attr('DEFAULT_BUY_UNIT_MEAS', IFSAPP.PART_CATALOG_API.Get(Prefix_Part_No__(rec_.c01)).unit_code, attr_);
IFSAPP.Client_SYS.Add_To_Attr('TAXABLE', 'False', attr_);
IFSAPP.Client_SYS.Set_Item_Value('CONTRACT', contract_, attr_);
IFSAPP.PURCHASE_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');