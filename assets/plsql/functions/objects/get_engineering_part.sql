FUNCTION Get_Engineering_Part__(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2) RETURN PART_REC IS
    obj_ PART_REC;

    CURSOR get_engineering_object_ IS
        SELECT objid, objversion
        FROM &AO.ENG_PART_REVISION
        WHERE part_no = part_no_
        AND part_rev = part_rev_;
BEGIN
    OPEN get_engineering_object_;
        FETCH get_engineering_object_ INTO obj_;
    CLOSE get_engineering_object_;

    RETURN obj_;
END Get_Engineering_Part__;