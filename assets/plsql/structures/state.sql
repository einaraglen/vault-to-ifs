PROCEDURE State__ IS

    info_               VARCHAR2(2000);
    attr_               VARCHAR2(2000);
    objstate_           VARCHAR2(200);

    CURSOR get_revision_object(p_part_no_ IN VARCHAR2, p_part_rev_ IN VARCHAR2) IS
        SELECT *
        FROM   &AO.ENG_PART_REVISION
        WHERE  part_no = p_part_no_
        AND    part_rev = p_part_rev_;

    obj_            get_revision_object%ROWTYPE;

BEGIN

    OPEN get_revision_object(Part_Number__(:c01), :c02);

        FETCH get_revision_object INTO obj_;
    
        objstate_   := &AO.Eng_Part_Revision_API.Get_Obj_State(Part_Number__(:c01), :c02);
    
        IF get_revision_object%FOUND AND objstate_ = 'Preliminary' AND :c18 = 'Released' THEN
            &AO.ENG_PART_REVISION_API.Set_Active__(info_, obj_.objid, obj_.objversion, attr_, 'DO');
        END IF;

    CLOSE get_revision_object;

END State__;