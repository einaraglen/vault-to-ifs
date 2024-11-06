FUNCTION Check_Engineering_Part__(part_no_ IN VARCHAR2) RETURN BOOLEAN IS
    count_ NUMBER;

    CURSOR get_engineering_object_ IS
        SELECT COUNT(1)
        FROM &AO.ENG_PART_MASTER
        WHERE part_no = part_no_;
BEGIN
    OPEN get_engineering_object_;
        FETCH get_engineering_object_ INTO count_;
    CLOSE get_engineering_object_;

    RETURN (count_ > 0);
END Check_Engineering_Part__;