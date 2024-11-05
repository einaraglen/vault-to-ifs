FUNCTION Check_Editable__(part_no_ IN VARCHAR2) RETURN BOOLEAN IS
BEGIN
    RETURN SUBSTR(part_no_, 1, 2) LIKE '161' OR SUBSTR(part_no_, 1, 3) NOT LIKE '160';
END Check_Editable__;