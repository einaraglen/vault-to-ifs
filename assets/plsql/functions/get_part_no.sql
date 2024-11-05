FUNCTION Get_Part_No__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
    value_      VARCHAR2(100);
    prefix_     VARCHAR2(5) := 'SE';
BEGIN
    IF SUBSTR(part_no_, 1, 1) = '1' 
    OR SUBSTR(part_no_, 1, 2) = 'PD'
    OR SUBSTR(part_no_, 1, 2) = 'SEM' THEN
        value_ := part_no_;
    ELSE
        value_ := prefix_ || part_no_;
    END IF;

    RETURN value_;
END Get_Part_No__;