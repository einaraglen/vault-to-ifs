export const Create_Master_Part = `
    FUNCTION Create_Master_Part RETURN VARCHAR2 IS
        info_           VARCHAR2(2000);
        attr_           VARCHAR2(2000);
        objid_          VARCHAR2(2000);
        objversion_     VARCHAR2(2000);

        prefix_         VARCHAR2(3);
        tracking_       VARCHAR2(2000);
        last_rev_       VARCHAR2(50);
        new_rev_        VARCHAR2(50);

        CURSOR get_master_part(part_ IN VARCHAR2) IS
            SELECT objid, objversion
            FROM &AO.ENG_PART_MASTER
            WHERE part_no = part_;

        CURSOR get_catalog_part(part_ IN VARCHAR2) IS
            SELECT objid, objversion
            FROM &AO.PART_CATALOG
            WHERE part_no = part_;

        CURSOR get_latest_revision(part_ IN VARCHAR2, rev_ IN VARCHAR2) IS
            SELECT PART_REV
            FROM &AO.ENG_PART_REVISION
            WHERE part_no = part_
            AND substr(part_rev, 1, 1) = SUBSTR(rev_, 1, 1)
            ORDER BY substr(part_rev, 1, 1),
                TO_NUMBER(REGEXP_SUBSTR(part_rev, '[0-9]+')) DESC NULLS LAST;
    BEGIN

        OPEN get_master_part(Get_Part_No(:c01));
            FETCH get_master_part
                INTO objid_, objversion_;

            IF get_master_part%NOTFOUND THEN
                &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');

                &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No(:c01), attr_);
                &AO.Client_SYS.Add_To_Attr('DESCRIPTION', :c07, attr_);
                &AO.Client_SYS.Add_To_Attr('FIRST_REVISION', :c02, attr_);
                &AO.Client_SYS.Add_To_Attr('UNIT_CODE', :c03, attr_);

                IF SUBSTR(:c01, 1, 1) LIKE '6' OR SUBSTR(:c01, 1, 1) LIKE '7' THEN
                    &AO.Client_SYS.Add_To_Attr('PROVIDE', 'Make', attr_);
                ELSE
                    &AO.Client_SYS.Add_To_Attr('PROVIDE', 'Buy', attr_);
                END IF;

                IF NVL(:c17, 'N') = 'Y' THEN
                    tracking_ := &AO.Part_Serial_Tracking_API.Decode('SERIAL TRACKING');
                    &AO.Client_SYS.Add_To_Attr('SERIAL_TRACKING_CODE', tracking_, attr_);
                    &AO.Client_SYS.Add_To_Attr('SERIAL_TYPE', tracking_, attr_);
                END IF;

                &AO.Client_SYS.Add_To_Attr('AQUISITION_CODE', 'Demand', attr_);
                &AO.Client_SYS.Add_To_Attr('PLANNING_METHOD', 'PMRP Planned', attr_);

                &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'DO');
            ELSE 
                OPEN get_latest_revision(Get_Part_No(:c01), :c02);
                    FETCH get_latest_revision
                        INTO last_rev_;

                    prefix_ := SUBSTR(:c01, 1, 2);
                    new_rev_ := :c02;

                    IF get_latest_revision%FOUND AND prefix_ NOT LIKE '16' THEN
                        new_rev_ := Get_Revision(last_rev_);
                    ELSIF get_latest_revision%FOUND AND prefix_ LIKE '16' THEN
                        new_rev_ := last_rev_;
                    ELSE
                        last_rev_ := &AO.Eng_Part_Revision_API.Get_Last_Rev(Get_Part_No(:c01));
                    END IF;

                CLOSE get_latest_revision;

                -- If the new revision does not match last => create new revision
                IF new_rev_ NOT LIKE last_rev_ THEN
                    &AO.Eng_Part_Revision_API.New_Revision_(Get_Part_No(:c01), new_rev_, last_rev_, NULL, NULL);
                END IF;

                OPEN get_catalog_part(Get_Part_No(:c01));
                    FETCH get_catalog_part
                        INTO objid_, objversion_;

                    -- Do not update description for 16(6) | 16(7) | SE(6) | SE(7)
                     IF prefix_ NOT LIKE '6' AND prefix_ NOT LIKE '7' THEN 
                        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', :c07, attr_);
                        &AO.PART_CATALOG_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
                    END IF;
                CLOSE get_catalog_part;

                prefix_ := SUBSTR(Get_Part_No(:c01), 3, 1);

            END IF;

        CLOSE get_master_part;

        RETURN new_rev_;
    END Create_Master_Part;
`