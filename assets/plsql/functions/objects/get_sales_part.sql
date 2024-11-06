FUNCTION Get_Sales_Part__(part_no_ IN VARCHAR2) RETURN PART_REC IS
    obj_ PART_REC;

    CURSOR get_sales_object_ IS
        SELECT objid, objversion
        FROM   &AO.SALES_PART
        WHERE  contract = g_contract_
        AND    catalog_no = part_no_;
BEGIN
    obj_.found := FALSE;

    OPEN get_sales_object_;
        FETCH get_sales_object_ INTO obj_.objid, obj_.objversion;
        obj_.found := get_sales_object_%FOUND;
    CLOSE get_sales_object_;

    RETURN obj_;
END Get_Sales_Part__;