FUNCTION Part_Children__(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2) RETURN NUMBER IS

    info_               VARCHAR2(2000);
    attr_               VARCHAR2(2000);
    objid_              VARCHAR2(2000);
    objversion_         VARCHAR2(2000);
    objstate_           VARCHAR2(200);
    cnt_                NUMBER;

    CURSOR get_child_count IS
        SELECT COUNT(*)
        FROM   &AO.ENG_PART_STRUCTURE_EXT_CFV
        WHERE  part_no = part_no_
        AND    part_rev = part_rev_;

BEGIN

    OPEN get_child_count;
        FETCH get_child_count
            INTO cnt_;
    CLOSE get_child_count;

    RETURN cnt_;

END Part_Children__;