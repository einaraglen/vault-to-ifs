PROCEDURE Engineering__ IS

    info_           VARCHAR2(2000);
    attr_           VARCHAR2(2000);
    objid_          VARCHAR2(2000);
    objversion_     VARCHAR2(2000);
   
    CURSOR get_master_obj(part_no_ IN VARCHAR2) IS
        SELECT *
        FROM &AO.ENG_PART_MASTER 
        WHERE part_no = part_no_;

    m_obj_          get_master_obj%ROWTYPE;

BEGIN

    OPEN get_master_obj(Part_Number__(:c01));
        FETCH get_master_obj INTO m_obj_;
        
        IF get_master_obj%NOTFOUND THEN
            &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');

            &AO.Client_SYS.Add_To_Attr('PART_NO', Part_Number__(:c01), attr_);
            &AO.Client_SYS.Add_To_Attr('DESCRIPTION', 'Engineering Part', attr_);
            &AO.Client_SYS.Set_Item_Value('UNIT_CODE', &AO.PART_CATALOG_API.Get(Part_Number__(:c01)).unit_code, attr_);
            &AO.Client_SYS.Add_To_Attr('STD_NAME_ID', '0', attr_);
            &AO.Client_SYS.Set_Item_Value('FIRST_REVISION', :c02, attr_);

            &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'DO');
        ELSE
            IF g_revision_.new_rev_ IS NOT NULL 
                AND g_revision_.current_part_rev_ IS NOT NULL 
                AND g_revision_.current_part_rev_ != g_revision_.new_rev_ THEN

                &AO.Eng_Part_Revision_API.New_Revision_(Part_Number__(:c01), g_revision_.new_rev_, g_revision_.current_part_rev_, NULL, NULL);
            
            END IF;
        END IF;

    CLOSE get_master_obj;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20002, 'EngineeringPart' || CHR(10) ||SQLERRM);

END Engineering__;