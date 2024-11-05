DECLARE
  info_               VARCHAR2(2000);
  attr_               VARCHAR2(2000);
  objid_              VARCHAR2(2000);
  objversion_         VARCHAR2(2000);
  objstate_           VARCHAR2(200);
  cnt_                NUMBER;

    CURSOR get_child_count(p_part_no_ IN VARCHAR2, p_part_rev_ IN VARCHAR2) IS
        SELECT COUNT(*)
        FROM   &AO.ENG_PART_STRUCTURE_EXT_CFV
        WHERE  part_no = p_part_no_
        AND    part_rev = p_part_rev_;

  FUNCTION Get_Part_No__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefixed_part_no_ VARCHAR2(100);
        prefix_           VARCHAR2(5) := 'SE';
    BEGIN
        IF SUBSTR(part_no_, 1, 1) = '1' OR SUBSTR(part_no_, 1, 2) = 'PD' THEN
            prefixed_part_no_ := part_no_;
        ELSE
            prefixed_part_no_ := prefix_ || part_no_;
        END IF;
        RETURN(prefixed_part_no_);
    END Get_Part_No__;

BEGIN
    OPEN get_child_count(Get_Part_No__(:c01), :c02);
        FETCH get_child_count
            INTO cnt_;
    CLOSE get_child_count;

    :state := cnt_;
END;