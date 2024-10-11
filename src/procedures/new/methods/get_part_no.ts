const Get_Part_No = `
    FUNCTION Get_Part_No(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefixed_part_no_ VARCHAR2(100);
        prefix_           VARCHAR2(5) := 'SE';
    BEGIN
        IF ((part_no_ IS NULL) 
        OR (SUBSTR(part_no_, 1, LENGTH(prefix_)) = prefix_) 
        OR ((LENGTH(part_no_) = 7) 
        AND (SUBSTR(part_no_, 1, 1) != '2')) 
        OR (LENGTH(part_no_) != 7)) THEN
            prefixed_part_no_ := part_no_;
        ELSE
            prefixed_part_no_ := prefix_ || part_no_;
        END IF;
        RETURN (prefixed_part_no_);
    END Get_Part_No;
`