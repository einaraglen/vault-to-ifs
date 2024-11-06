FUNCTION Check_Child_Count__(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2) RETURN NUMBER IS
    count_ NUMBER;

    CURSOR get_child_count IS
        SELECT COUNT(*)
        FROM   &AO.ENG_PART_STRUCTURE_EXT_CFV
        WHERE  part_no = part_no_
        AND    part_rev = part_rev_;
BEGIN
    OPEN get_child_count;
        FETCH get_child_count INTO count_;
    CLOSE get_child_count;

    RETURN count_;
END Check_Child_Count__;