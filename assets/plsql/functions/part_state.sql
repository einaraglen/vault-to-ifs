FUNCTION Part_State__(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2) RETURN VARCHAR2 IS
BEGIN
    RETURN &AO.Eng_Part_Revision_API.Get_Obj_State(part_no_, part_rev_);
END Part_State__;