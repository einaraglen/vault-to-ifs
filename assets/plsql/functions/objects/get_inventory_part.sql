FUNCTION Get_Inventory_Part__(part_no_ IN VARCHAR2) RETURN PART_REC IS
    obj_ PART_REC;

    CURSOR get_inventory_object_ IS
        SELECT objid, objversion
        FROM   &AO.INVENTORY_PART
        WHERE  contract = contract_
        AND    part_no = part_no_;
BEGIN
    OPEN get_inventory_object_;
        FETCH get_inventory_object_ INTO obj_;
    CLOSE get_inventory_object_;

    RETURN obj_;
END Get_Inventory_Part__;