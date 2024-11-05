FUNCTION Get_Catalog_Part__(part_no_ IN VARCHAR2) RETURN PART_REC IS
    obj_ PART_REC;

    CURSOR get_catalog_object_ IS
        SELECT objid, objversion 
        FROM &AO.PART_CATALOG 
        WHERE part_no = part_no_;
BEGIN
    OPEN get_catalog_object_;
        FETCH get_catalog_object_ INTO obj_;
    CLOSE get_catalog_object_;

    RETURN obj_;
END Get_Catalog_Part__;