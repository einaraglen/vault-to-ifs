const Create_Master_Part = `
    PROCEDURE Create_Master_Part IS
        info_           VARCHAR2(2000);
        attr_           VARCHAR2(2000);
        objid_          VARCHAR2(2000);
        objversion_     VARCHAR2(2000);

        prefix_         VARCHAR2(3);

        CURSOR get_master_part(part_ IN VARCHAR2) IS
            SELECT objid, objversion
            FROM   &AO.ENG_PART_MASTER
            WHERE  part_no = part_;
    BEGIN

        OPEN get_master_part(Get_Part_No(:part_no));

            FETCH get_master_part
                INTO objid_, objversion_;

            IF get_latest_revision%NOTFOUND THEN
                &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');

                &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No(:part_no), attr_);
                &AO.Client_SYS.Add_To_Attr('DESCRIPTION', :description, attr_);
                &AO.Client_SYS.Add_To_Attr('FIRST_REVISION', :rev, attr_);
                &AO.Client_SYS.Add_To_Attr('UNIT_CODE', :unit, attr_);

                &AO.Client_SYS.Add_To_Attr('PROVIDE', 'Buy', attr_);
                &AO.Client_SYS.Add_To_Attr('AQUISITION_CODE', 'Demand', attr_);
                &AO.Client_SYS.Add_To_Attr('PLANNING_METHOD', 'PMRP Planned', attr_);
                &AO.Client_SYS.Add_To_Attr('SERIAL_TYPE', 'Not Serial Tracking', attr_);
                &AO.Client_SYS.Add_To_Attr('REV_NO_MAX', '1', attr_);
                &AO.Client_SYS.Add_To_Attr('REV_NO_APP', '0', attr_);
                &AO.Client_SYS.Add_To_Attr('SERIAL_TRACKING_CODE', 'Not Serial Tracking', attr_);

                &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'DO');
            ELSE 
                prefix_ := SUBSTR(Prefix_Part_No__(:part_no), 1, 3);

                IF prefix_ NOT LIKE '166' OR prefix_ NOT LIKE 'SE6' THEN
                    &AO.Client_SYS.Add_To_Attr('DESCRIPTION', :description, attr_);
                    &AO.ENG_PART_MASTER_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
                END IF;
           
            END IF;

        CLOSE get_master_part;

    END Create_Master_Part;
`