-- NEW
IFSAPP.PART_CATALOG_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');

IFSAPP.Client_SYS.Add_To_Attr('PART_NO', Prefix_Part_No__(rec_.c01), attr_);
IFSAPP.Client_SYS.Add_To_Attr('DESCRIPTION', rec_.c07, attr_);
IFSAPP.Client_SYS.Add_To_Attr('UNIT_CODE', rec_.C03, attr_);
IFSAPP.Client_SYS.Add_To_Attr('STD_NAME_ID', '0', attr_);

-- SET NET WEIGHT + UOM
IFSAPP.Client_SYS.Add_To_Attr('WEIGHT_NET', weight_net_, attr_);
IFSAPP.Client_SYS.Add_To_Attr('UOM_FOR_WEIGHT_NET', 'kg', attr_);

-- ALLOW SUB PARTS TO BE SERIAL TRACKED
&AO.Client_SYS.Add_To_Attr('ALLOW_AS_NOT_CONSUMED_DB', 'TRUE', attr_);
&AO.Client_SYS.Add_To_Attr('ENG_SERIAL_TRACKING_CODE_DB', 'SERIAL TRACKING', attr_);

IFSAPP.PART_CATALOG_API.New__(info_, objid_, objversion_, attr_, 'DO');

-- UPDATE
IFSAPP.Client_SYS.Add_To_Attr('DESCRIPTION', rec_.C07, attr_);

-- UPDATE NET WEIGHT
IFSAPP.Client_SYS.Add_To_Attr('WEIGHT_NET', weight_net_, attr_);

IFSAPP.PART_CATALOG_API.Modify__(info_, objid_, objversion_, attr_, 'DO');


