PROCEDURE Structure__ IS
  info_               VARCHAR2(2000);
  attr_               VARCHAR2(2000);
  objid_              VARCHAR2(2000);
  objversion_         VARCHAR2(2000);
  exists_             NUMBER;

  prev_part_rev_      VARCHAR2(200);
  found_              BOOLEAN := FALSE;
  position_           VARCHAR2(200);

  CURSOR check_sub_struct(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2, sub_part_no_ IN VARCHAR2, sub_part_rev_ IN VARCHAR2) IS
    SELECT COUNT(*)
    FROM   &AO.ENG_PART_STRUCTURE epr
    WHERE  epr.part_no = part_no_
    AND    epr.part_rev = part_rev_
    AND    epr.sub_part_no = sub_part_no_
    AND    epr.sub_part_rev = sub_part_rev_;

  CURSOR get_prev_rev(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2 ) IS
    SELECT part_rev
    FROM &AO.eng_part_revision
    WHERE part_no = part_no_
    AND rev_no < (select rev_no FROM &AO.eng_part_revision
    WHERE part_no = part_no_
    and part_rev = part_rev_ );

  CURSOR get_struct_object(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2, sub_part_no_ IN VARCHAR2, sub_part_rev_ IN VARCHAR2) IS
    SELECT objid, objversion
    FROM   &AO.ENG_PART_STRUCTURE epr
    WHERE  epr.part_no = part_no_
    AND    epr.part_rev = part_rev_
    AND    epr.sub_part_no = sub_part_no_
    AND    epr.sub_part_rev = sub_part_rev_;

  -- ADDED
  CURSOR get_prev_added(  part_no_ IN VARCHAR2,
    prev_part_rev_ IN VARCHAR2,
    sub_part_no_ IN VARCHAR2,
    sub_part_rev_ IN VARCHAR2 )  IS
    SELECT * 
    FROM &AO.ENG_PART_STRUCTURE a
    WHERE part_no = part_no_
    AND part_rev = prev_part_rev_
    AND sub_part_no = sub_part_no_;

  -- REVISION_CHANGED
  CURSOR get_prev_rev_chg(  part_no_ IN VARCHAR2,
    prev_part_rev_ IN VARCHAR2,
    sub_part_no_ IN VARCHAR2,
    sub_part_rev_ IN VARCHAR2 )  IS
    SELECT * 
    FROM &AO.ENG_PART_STRUCTURE a
    WHERE part_no = part_no_
    AND SUBSTR(part_rev,1,1) = SUBSTR(prev_part_rev_,1,1)
    AND sub_part_no = sub_part_no_
    AND SUBSTR(sub_part_rev,1,1) != SUBSTR(sub_part_rev_,1,1);

  -- QUANTITY_CHANGED
  CURSOR get_prev_qty(  part_no_ IN VARCHAR2,
    prev_part_rev_ IN VARCHAR2,
    sub_part_no_ IN VARCHAR2,
    sub_part_rev_ IN VARCHAR2,
    sub_qty_ IN NUMBER )  IS
    SELECT * 
    FROM &AO.ENG_PART_STRUCTURE a
    WHERE part_no = part_no_
    AND part_rev = prev_part_rev_
    AND sub_part_no = sub_part_no_
    AND sub_part_rev = sub_part_rev_
    AND qty != sub_qty_;
  
BEGIN
  -- INSERT SUB PART
  OPEN check_sub_struct(Part_Number__(:c02), :c03, Part_Number__(:c06), :c07);
    FETCH check_sub_struct 
      INTO exists_;
  CLOSE check_sub_struct;

  IF exists_ = 0 THEN
    &AO.ENG_PART_STRUCTURE_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
    &AO.Client_SYS.Add_To_Attr('STRUCTURE_ID', 'STD', attr_);
    &AO.Client_SYS.Add_To_Attr('PART_NO', Part_Number__(:c02), attr_);
    &AO.Client_SYS.Add_To_Attr('PART_REV', :c03, attr_);
    &AO.Client_SYS.Add_To_Attr('SUB_PART_NO', Part_Number__(:c06), attr_);
    &AO.Client_SYS.Add_To_Attr('SUB_PART_REV', :c07, attr_);

    -- Fix for max POS Lenght = 10
    position_ := :c04;

    IF INSTR(:c04, '.') > 0 THEN
      position_ := '..' || SUBSTR(:c04, INSTR(:c04, '.', -1) + 1);
    END IF;

    &AO.Client_SYS.Add_To_Attr('POS', position_, attr_);
    
    &AO.Client_SYS.Set_Item_Value('QTY', :n01, attr_);
    &AO.ENG_PART_STRUCTURE_API.New__(info_, objid_, objversion_, attr_, 'DO');
  END IF;

  -- SPARE PART
  IF :c09 LIKE '1' THEN
    attr_ := NULL;
    &AO.Eng_Part_Spare_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
    &AO.Client_SYS.Add_To_Attr('PART_NO', Part_Number__(:c02), attr_);
    &AO.Client_SYS.Add_To_Attr('PART_REV', :c03, attr_);
    &AO.Client_SYS.Add_To_Attr('SPARE_PART_NO', Part_Number__(:c06), attr_);
    &AO.Client_SYS.Add_To_Attr('SPARE_PART_REV', :c07, attr_);
    &AO.Client_SYS.Add_To_Attr('QTY', :n01, attr_);
    &AO.Client_SYS.Add_To_Attr('INFO', 'VAULT_SERVER', attr_);
    &AO.Eng_Part_Spare_API.New__(info_, objid_, objversion_, attr_, 'DO');
  END IF;

  -- CHANGE LOGS
  OPEN get_struct_object(Part_Number__(:c02), :c03, Part_Number__(:c06), :c07);
    FETCH get_struct_object
      INTO objid_, objversion_;
  CLOSE get_struct_object;

  OPEN get_prev_rev(Part_Number__(:c02), :c03); 

    FETCH get_prev_rev 
        INTO prev_part_rev_;

    IF get_prev_rev%NOTFOUND THEN
      RETURN;
    END IF;

    FOR a_ IN get_prev_added(Part_Number__(:c02), prev_part_rev_, Part_Number__(:c06), :c07 ) LOOP
      found_ := TRUE;
    END LOOP;

    IF NOT (found_) THEN

      attr_ := NULL;
      &AO.Client_SYS.Add_To_Attr('STR_COMMENT','ADDED',attr_);
      &AO.ENG_PART_STRUCTURE_API.Modify__( info_, objid_, objversion_, attr_, 'DO');
    ELSE

      FOR a_ IN get_prev_rev_chg(Part_Number__(:c02), prev_part_rev_, Part_Number__(:c06), :c07 ) LOOP
        found_ := TRUE;
        attr_ := NULL;
        &AO.Client_SYS.Add_To_Attr('STR_COMMENT','REVISION_CHANGED',attr_);
        &AO.ENG_PART_STRUCTURE_API.Modify__( info_, objid_, objversion_, attr_, 'DO');
      END LOOP;

      IF NOT ( found_ ) THEN

        FOR a_ IN get_prev_qty(Part_Number__(:c02), prev_part_rev_, Part_Number__(:c06), :c07, :n01) LOOP
          found_ := TRUE;
          attr_ := NULL;
          &AO.Client_SYS.Add_To_Attr('STR_COMMENT','QTY_CHANGED',attr_);
          &AO.ENG_PART_STRUCTURE_API.Modify__( info_, objid_, objversion_, attr_, 'DO');
        END LOOP;

      END IF;
    END IF;
    
    CLOSE get_prev_rev;

END Structure__;