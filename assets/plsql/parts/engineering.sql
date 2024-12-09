-- NEW
IFSAPP.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
IFSAPP.Client_SYS.Add_To_Attr('PART_NO', Prefix_Part_No__(rec_.c01), attr_);

-- TODO: Keep this as some generic desc since main will be from CATALOG?
IFSAPP.Client_SYS.Add_To_Attr('DESCRIPTION', 'Engineering Part', attr_);

IFSAPP.Client_SYS.Set_Item_Value('UNIT_CODE', IFSAPP.PART_CATALOG_API.Get(Prefix_Part_No__(rec_.c01)).unit_code, attr_);
IFSAPP.Client_SYS.Add_To_Attr('STD_NAME_ID', '0', attr_);

IF (rec_.c02 IS NOT NULL) THEN
    IFSAPP.Client_SYS.Set_Item_Value('FIRST_REVISION', rec_.c02, attr_);
END IF;

IF (NVL(rec_.C17, 'N') = 'Y') THEN
    IFSAPP.Client_SYS.Add_To_Attr('SERIAL_TRACKING_CODE', IFSAPP.PART_SERIAL_TRACKING_API.Decode('SERIAL TRACKING'), attr_);
    IFSAPP.Client_SYS.Add_To_Attr('SERIAL_TYPE', IFSAPP.PART_SERIAL_TRACKING_API.Decode('SERIAL TRACKING'), attr_);
END IF;

IFSAPP.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'DO');

-- UPDATE
IFSAPP.ENG_PART_REVISION_API.New_Revision_(Prefix_Part_No__(rec_.c01), new_rev_, current_part_rev_, NULL, NULL);