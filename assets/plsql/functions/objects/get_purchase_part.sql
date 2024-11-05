FUNCTION Get_Purchase_Part__(part_no_ IN VARCHAR2) RETURN PART_REC IS
    obj_ PART_REC;

    CURSOR get_purchase_object_ IS
        SELECT objid, objversion
        FROM &AO.PURCHASE_PART
        WHERE contract = contract_
        AND part_no = part_no_;
BEGIN
    OPEN get_purchase_object_;
        FETCH get_purchase_object_ INTO obj_;
    CLOSE get_purchase_object_;

    RETURN obj_;
END Get_Purchase_Part__;