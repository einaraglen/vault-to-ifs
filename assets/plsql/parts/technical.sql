-- NEW
IFSAPP.Client_SYS.Add_To_Attr('LU_NAME', 'PartCatalog', attr_);
IFSAPP.Client_SYS.Add_To_Attr('KEY_REF', 'PART_NO=' || Prefix_Part_No__(rec_.c01) || '^', attr_);
IFSAPP.Client_SYS.Add_To_Attr('TECHNICAL_SPEC_NO', 0, attr_);
IFSAPP.Client_SYS.Add_To_Attr('TECHNICAL_CLASS', 'SEPARTINFO', attr_);
IFSAPP.Client_SYS.Add_To_Attr('OK_YES_NO', IFSAPP.TECHNICAL_OBJ_REF_APPROVED_API.Decode('1'), attr_);
IFSAPP.Client_SYS.Add_To_Attr('OK_SIGN', 'IFSAPP', attr_);
IFSAPP.Client_SYS.Add_To_Attr('DT_OK', TRUNC(SYSDATE), attr_);
IFSAPP.TECHNICAL_OBJECT_REFERENCE_API.NEW__(info_, objid_, objversion_, attr_, 'DO');

technical_spec_no_ := IFSAPP.Client_SYS.Get_Item_Value('TECHNICAL_SPEC_NO', attr_);

-- EVERY
FOR r_ IN get_tech_spec_attr(technical_spec_no_) LOOP
    IF r_.attribute = 'SE_INTDESC' THEN
        IFSAPP.Client_SYS.Add_To_Attr('INFO', SUBSTR(rec_.c09, 1, 2000), attr_);
    ELSIF r_.attribute = 'SE_CAT1' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c11, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_CAT2' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c12, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_CAT3' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c13, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_CAT4' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c14, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_CRITIC_ITEM' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c20, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_LLI' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c21, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_MATCERT' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c10, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_MATERIAL' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c23, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_PROJECT' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c24, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_SERIAL_NO' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c17, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_SPARE_PART' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c15, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_SUPP_PARTNO' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c22, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_VENDOR_NAME' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c16, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_CREATED_BY' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(rec_.c31, 1, 20), attr_);
    ELSIF r_.attribute = 'SE_CREATED_DATE' THEN
        IFSAPP.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(to_char(to_date(rec_.c32, 'yyyy-mm-dd hh24:mi:ss"Z"'), 'yyyy-mm-dd'), 1, 20), attr_);
    END IF;

    IF attr_ IS NOT NULL AND NOT IFSAPP.TECHNICAL_OBJECT_REFERENCE_API.Check_Approved(technical_spec_no_) THEN
        IFSAPP.TECHNICAL_SPEC_ALPHANUM_API.Modify__(info_, r_.objid, r_.objversion, attr_, 'DO');
    END IF;

END LOOP;