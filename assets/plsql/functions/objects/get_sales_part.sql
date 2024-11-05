FUNCTION Get_Sales_Part__(part_no_ IN VARCHAR2) RETURN PART_REC IS
    obj_ PART_REC;

    CURSOR get_sales_object_ IS
        SELECT objid, objversion
        FROM   &AO.SALES_PART
        WHERE  contract = contract_
        AND    catalog_no = part_no_;
BEGIN
    OPEN get_sales_object_;
        FETCH get_sales_object_ INTO obj_;
    CLOSE get_sales_object_;

    RETURN obj_;
END Get_Sales_Part__;