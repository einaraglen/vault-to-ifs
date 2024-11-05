PROCEDURE Set_Struct_State__ IS
  info_               VARCHAR2(2000);
  attr_               VARCHAR2(2000);
  objid_              VARCHAR2(2000);
  objversion_         VARCHAR2(2000);
  objstate_           VARCHAR2(200);

    CURSOR get_revision_object(p_part_no_ IN VARCHAR2, p_part_rev_ IN VARCHAR2) IS
        SELECT objid, objversion
        FROM   &AO.ENG_PART_REVISION
        WHERE  part_no = p_part_no_
        AND    part_rev = p_part_rev_;
BEGIN
    objstate_   := &AO.Eng_Part_Revision_API.Get_Obj_State(Get_Part_No__(:c01), :c02);
    IF objstate_ = 'Preliminary' AND :c18 = 'Released' THEN
        OPEN get_revision_object(Get_Part_No__(:c01), :c02);

            FETCH get_revision_object
                INTO objid_, objversion_;

            IF get_revision_object%FOUND THEN
                &AO.ENG_PART_REVISION_API.Set_Active__(info_, objid_, objversion_, attr_, 'DO');
            END IF;

        CLOSE get_revision_object;
    END IF;
END Set_Struct_State__;