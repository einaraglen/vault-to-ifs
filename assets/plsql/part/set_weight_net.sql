PROCEDURE Set_Weight_Net__ IS
    attr_                   VARCHAR2(2000);
    info_                   VARCHAR2(2000);
    objid_                  VARCHAR2(2000);
    objversion_             VARCHAR2(2000);
    uom_for_weight_net_     VARCHAR2(50);

    mass_g_                 VARCHAR2(200) := :c25;
    test_                   NUMBER := 0;
    weight_net_             NUMBER := 0;
    ok_                     BOOLEAN := FALSE;

    error_message     VARCHAR2(20000);

    CURSOR get_part(part_no_ IN VARCHAR2) IS
        SELECT objid, objversion, uom_for_weight_net
        FROM &AO.PART_CATALOG p
        WHERE part_no = part_no_;   
    
BEGIN 
    BEGIN
        BEGIN
            test_ := TO_NUMBER(mass_g_);
            ok_   := TRUE;
        EXCEPTION
            WHEN OTHERS THEN
                ok_ := FALSE;
        END;

        IF NOT (ok_) THEN
            BEGIN
                test_ := TO_NUMBER(REPLACE(mass_g_, ',', '.'));
                ok_   := TRUE;
            EXCEPTION
                WHEN OTHERS THEN
                    ok_ := FALSE;
            END;
        END IF;

        IF NOT (ok_) THEN
            BEGIN
                test_ := TO_NUMBER(REPLACE(mass_g_, '.', ','));
                ok_   := TRUE;
                EXCEPTION
                    WHEN OTHERS THEN
                        ok_ := FALSE;
            END;
        END IF;

        IF test_ > 0 THEN
            weight_net_ := test_ / 1000;
        END IF;
    END;

    OPEN get_part(Get_Part_No__(:c01));
        FETCH get_part INTO objid_, objversion_, uom_for_weight_net_;
    CLOSE get_part;

    &AO.Client_SYS.Add_To_Attr('WEIGHT_NET', weight_net_, attr_);

    IF uom_for_weight_net_ IS NULL THEN 
        &AO.Client_SYS.Add_To_Attr('UOM_FOR_WEIGHT_NET', 'kg', attr_);
    END IF;
    
    &AO.PART_CATALOG_API.Modify__(info_, objid_, objversion_, attr_, 'DO');

EXCEPTION
    WHEN OTHERS THEN
        error_message := SQLERRM;

g_error_message := 'Set_Weight_Net__:' || error_message;
END Set_Weight_Net__;