FUNCTION Get_Purchase_Part__(part_no_ IN VARCHAR2) RETURN PART_REC IS
    obj_ PART_REC;

    CURSOR get_purchase_object_ IS
        SELECT objid, objversion
        FROM &AO.PURCHASE_PART
        WHERE contract = g_contract_
        AND part_no = part_no_;
BEGIN
    obj_.found := FALSE;

    OPEN get_purchase_object_;
        FETCH get_purchase_object_ INTO obj_.objid, obj_.objversion;
        obj_.found := get_purchase_object_%FOUND;
    CLOSE get_purchase_object_;

    RETURN obj_;
END Get_Purchase_Part__;