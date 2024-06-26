import { Connection } from "../../providers/ifs/internal/Connection";
import { InMessage, get_bind_keys, get_bindings } from "../../utils";

const plsql = `
DECLARE
    new_revision_   VARCHAR2(200);

    cnt_            NUMBER := 0;
    info_           VARCHAR2(2000);
    attr_           VARCHAR2(2000);
    objid_          VARCHAR2(2000);
    objversion_     VARCHAR2(2000);

    current_part_rev_ VARCHAR2(20);
    part_no_          VARCHAR2(100);

    CURSOR check_eng_part_master(part_ IN VARCHAR2) IS
        SELECT COUNT(1) FROM &AO.ENG_PART_MASTER WHERE part_no = part_;

    CURSOR get_eng_part_revision(p_part_no_ IN VARCHAR2, p_part_rev_ IN VARCHAR2) IS
        SELECT *
        FROM   &AO.ENG_PART_REVISION
        WHERE  part_no = p_part_no_
        AND    part_rev = p_part_rev_;

    CURSOR get_latest_revision(p_part_no_ IN VARCHAR2, p_part_rev_ IN VARCHAR2) IS
        SELECT *
        FROM   &AO.ENG_PART_REVISION
        WHERE  part_no = p_part_no_
        AND    substr(part_rev, 1, 1) = SUBSTR(p_part_rev_, 1, 1)
        ORDER  BY part_rev DESC;

    eng_part_revision_rec_ get_eng_part_revision%ROWTYPE;

    CURSOR part_master_get_version(part_ IN VARCHAR2) IS
        SELECT objid, objversion FROM &AO.ENG_PART_MASTER WHERE part_no = part_;

    new_rev_ VARCHAR2(200);

    FUNCTION Get_New_Revision__(current_revision_ IN VARCHAR2) RETURN VARCHAR2 IS
        BEGIN
        RETURN substr(current_revision_, 1, 1) || lpad(substr(rpad(current_revision_, 3, '0'), -2) + 1, 2, '0');
        END Get_New_Revision__;

BEGIN
    -- eng_part_master
    part_no_ := :c01;
    
    OPEN check_eng_part_master(:c01);

        FETCH check_eng_part_master
            INTO cnt_;

    CLOSE check_eng_part_master;

    IF (cnt_ = 0) THEN
        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
        &AO.Client_SYS.Add_To_Attr('PART_NO', :c01, attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || :c01), attr_);
        &AO.Client_SYS.Set_Item_Value('UNIT_CODE', &AO.Part_Catalog_API.Get(:c01).unit_code, attr_);
        &AO.Client_SYS.Add_To_Attr('STD_NAME_ID', '0', attr_);

        IF (:c02 IS NOT NULL) THEN
            &AO.Client_SYS.Set_Item_Value('FIRST_REVISION', :c02, attr_);
        END IF;

        IF (NVL(:c17, 'N') = 'Y') THEN
            &AO.Client_SYS.Add_To_Attr('SERIAL_TRACKING_CODE',
            &AO.Part_Serial_Tracking_API.Decode('SERIAL TRACKING'), attr_);
            &AO.Client_SYS.Add_To_Attr('SERIAL_TYPE',
            &AO.Part_Serial_Tracking_API.Decode('SERIAL TRACKING'), attr_);
        END IF;

        &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'DO');

        -- Fix?
        &AO.ENG_PART_REVISION_API.Set_Active(part_no_, :c02);

        new_revision_ := :c02;

    ELSE
        OPEN get_latest_revision(:c01, :c02);

            FETCH get_latest_revision
                INTO eng_part_revision_rec_;

            current_part_rev_ := eng_part_revision_rec_.PART_REV;
            :temp := current_part_rev_;           

            IF get_latest_revision%FOUND AND SUBSTR(:c01, 1, 2) NOT LIKE '16' THEN
                /* Use last revision to calculate next revision */

                new_rev_      := Get_New_Revision__(current_part_rev_);
                new_revision_ := new_rev_;

            ELSIF get_latest_revision%FOUND AND SUBSTR(:c01, 1, 2) LIKE '16' THEN
                /* Parts start with 16 and this revision exists. Do not create a new... */
                
                IF current_part_rev_ != :c02 THEN
                    new_rev_      := NULL;
                    new_revision_ := current_part_rev_;
                ELSE
                    new_rev_      := NULL;
                    new_revision_ := :c02;
                END IF;

            ELSE

                /* This is the first revision for this letter */
                new_rev_      := :c02;
                new_revision_ := new_rev_;
                IF current_part_rev_ IS NULL THEN
                    current_part_rev_ := &AO.Eng_Part_Revision_API.Get_Last_Rev(:c01);
                END IF;

            END IF;

        CLOSE get_latest_revision;
        
        IF new_rev_ IS NOT NULL THEN
            &AO.Eng_Part_Revision_API.New_Revision_(:c01, new_rev_, current_part_rev_, NULL, NULL);

            IF :c18 = 'Released' THEN
                &AO.ENG_PART_REVISION_API.Set_Active(part_no_, new_rev_);
                &AO.ENG_PART_REVISION_API.Set_Active(part_no_, new_revision_);
            END IF;

        ELSIF :c18 = 'Obsolete' THEN
            &AO.ENG_PART_REVISION_API.Set_Obsolete(part_no_, new_rev_);
            &AO.ENG_PART_REVISION_API.Set_Obsolete(part_no_, new_revision_);
        END IF;

        IF :c18 = 'Released' THEN
            &AO.ENG_PART_REVISION_API.Set_Active(part_no_, new_revision_);
            &AO.ENG_PART_REVISION_API.Set_Active(part_no_, new_rev_);
        ELSIF :c18 = 'Obsolete' THEN
            &AO.ENG_PART_REVISION_API.Set_Obsolete(part_no_, new_rev_);
            &AO.ENG_PART_REVISION_API.Set_Obsolete(part_no_, new_revision_);
        END IF;
    END IF;
END;
`;

export const create_engineering_part = async (client: Connection, message: InMessage) => {
    const bind = get_bindings(message, get_bind_keys(plsql));

    const res = await client.PlSql(plsql, { ...bind, temp: "" });
  
    if (!res.ok) {
      throw Error(res.errorText);
    }
  
    return res;
  };