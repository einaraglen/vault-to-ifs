PROCEDURE Create_Engineering_Part__ IS
    info_           VARCHAR2(2000);
    attr_           VARCHAR2(2000);
    objid_          VARCHAR2(2000);
    objversion_     VARCHAR2(2000);
    objstate_       VARCHAR2(200);
    
    rev_            REV_REC;
    obj_            PART_REC;

    error_message     VARCHAR2(20000);
BEGIN
    rev_ := Get_Engineering_Latest__(Get_Part_No__(:c01), :c02);

    IF Check_Engineering_Part__(Get_Part_No__(:c01)) = FALSE THEN
        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
        &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || Get_Part_No__(:c01)), attr_);
        &AO.Client_SYS.Set_Item_Value('UNIT_CODE', &AO.Part_Catalog_API.Get(Get_Part_No__(:c01)).unit_code, attr_);
        &AO.Client_SYS.Add_To_Attr('STD_NAME_ID', '0', attr_);

        IF  (SUBSTR(:c01, 1, 1) LIKE '2') OR (SUBSTR(:c01, 1, 1) LIKE '7') OR (SUBSTR(:c01, 1, 1) LIKE '6') THEN
            &AO.Client_SYS.Add_To_Attr('PROVIDE', 'Make', attr_);
        ELSE
            &AO.Client_SYS.Add_To_Attr('PROVIDE', 'Buy', attr_);
        END IF;

        &AO.Client_SYS.Add_To_Attr('PLANNING_METHOD', 'PMRP Planned', attr_);

        IF (:c02 IS NOT NULL) THEN
            &AO.Client_SYS.Set_Item_Value('FIRST_REVISION', :c02, attr_);
        END IF;

        IF (NVL(:c17, 'N') = 'Y') THEN
            &AO.Client_SYS.Add_To_Attr('SERIAL_TRACKING_CODE',
            &AO.Part_Serial_Tracking_API.Decode('SERIAL TRACKING'), attr_);
            &AO.Client_SYS.Add_To_Attr('SERIAL_TYPE',
            &AO.Part_Serial_Tracking_API.Decode('SERIAL TRACKING'), attr_);
        END IF;

        &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'DO');

        rev_.new_rev := :c02;
    ELSE
        IF rev_.created THEN
            &AO.Eng_Part_Revision_API.New_Revision_(Get_Part_No__(:c01), rev_.new_rev, rev_.last_rev, NULL, NULL);
        END IF;
    END IF;

    objstate_   := &AO.Eng_Part_Revision_API.Get_Obj_State(Get_Part_No__(:c01), rev_.new_rev);

    IF objstate_ = 'Preliminary' AND SUBSTR(:c01, 1, 2) LIKE '16' THEN
        obj_ := Get_Engineering_Part__(Get_Part_No__(:c01), rev_.new_rev);
     
        IF obj_.objid IS NOT NULL THEN
            IF :c18 = 'Released' THEN
                &AO.ENG_PART_REVISION_API.Set_Active__(info_, obj_.objid, obj_.objversion, attr_, 'DO');
            ELSIF :c18 = 'Obsolete' THEN
                &AO.ENG_PART_REVISION_API.Set_To_Obsolete__(info_, obj_.objid, obj_.objversion, attr_, 'DO');
            END IF;
        END IF;
    END IF;

    g_new_rev_ := rev_.new_rev;

EXCEPTION
    WHEN OTHERS THEN
        error_message := SQLERRM;

g_error_message := rev_.new_rev || 'Create_Engineering_Part__:' || error_message;
END Create_Engineering_Part__;