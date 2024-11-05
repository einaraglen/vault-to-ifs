PROCEDURE Add_Spesification__ IS
    technical_spec_no_ NUMBER;
    attr_              VARCHAR2(32000);
    info_              VARCHAR2(32000);
    objid_             VARCHAR2(32000);
    objversion_        VARCHAR2(32000);

    error_message     VARCHAR2(20000);

    CURSOR get_tech_spec_attr(technical_spec_no_ IN NUMBER) IS
        SELECT OBJID,
            OBJVERSION,
            TECHNICAL_SPEC_NO,
            TECHNICAL_CLASS,
            ATTRIB_NUMBER,
            ATTRIBUTE,
            VALUE_TEXT,
            INFO
        FROM   &AO.TECHNICAL_SPEC_ALPHANUM
        WHERE  TECHNICAL_CLASS = 'SEPARTINFO'
        AND    TECHNICAL_SPEC_NO = technical_spec_no_
        ORDER  BY ATTRIB_NUMBER;
BEGIN
    technical_spec_no_ := &AO.TECHNICAL_OBJECT_REFERENCE_API.Get_Technical_Spec_No('PartCatalog', 'PART_NO=' || Get_Part_No__(:c01) || '^');
    
    IF technical_spec_no_ = -1 THEN
        attr_ := NULL;
        &AO.Client_SYS.Add_To_Attr('LU_NAME', 'PartCatalog', attr_);
        &AO.Client_SYS.Add_To_Attr('KEY_REF','PART_NO=' || Get_Part_No__(:c01) || '^', attr_);
        &AO.Client_SYS.Add_To_Attr('TECHNICAL_SPEC_NO', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('TECHNICAL_CLASS', 'SEPARTINFO', attr_);
        &AO.Client_SYS.Add_To_Attr('OK_YES_NO', &AO.TECHNICAL_OBJ_REF_APPROVED_API.Decode('1'), attr_);
        &AO.Client_SYS.Add_To_Attr('OK_SIGN', '&AO', attr_);
        &AO.Client_SYS.Add_To_Attr('DT_OK', TRUNC(SYSDATE), attr_);
        &AO.TECHNICAL_OBJECT_REFERENCE_API.NEW__(info_, objid_, objversion_, attr_, 'DO');
        technical_spec_no_ := &AO.Client_SYS.Get_Item_Value('TECHNICAL_SPEC_NO', attr_);
    END IF;
    FOR r_ IN get_tech_spec_attr(technical_spec_no_) LOOP
        attr_ := NULL;
        IF r_.attribute = 'SE_INTDESC' THEN
            &AO.Client_SYS.Add_To_Attr('INFO', SUBSTR(:c09, 1, 2000), attr_);
        ELSIF r_.attribute = 'SE_CAT1' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c11, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CAT2' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c12, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CAT3' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c13, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CAT4' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c14, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CRITIC_ITEM' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c20, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_LLI' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c21, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_MATCERT' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c10, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_MATERIAL' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c23, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_PROJECT' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c24, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_SERIAL_NO' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c17, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_SPARE_PART' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c15, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_SUPP_PARTNO' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c22, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_VENDOR_NAME' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c16, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CREATED_BY' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c31, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CREATED_DATE' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(to_char(to_date(:c32, 'yyyy-mm-dd hh24:mi:ss"Z"'), 'yyyy-mm-dd'), 1, 20), attr_);
        END IF;
        IF attr_ IS NOT NULL AND NOT &AO.TECHNICAL_OBJECT_REFERENCE_API.Check_Approved(technical_spec_no_) THEN
            &AO.TECHNICAL_SPEC_ALPHANUM_API.Modify__(info_, r_.objid, r_.objversion, attr_, 'DO');
        END IF;
    END LOOP;

EXCEPTION
    WHEN OTHERS THEN
        error_message := SQLERRM;

g_error_message := 'Add_Spesification__:' || error_message;
END Add_Spesification__;