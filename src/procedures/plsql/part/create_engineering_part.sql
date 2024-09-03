DECLARE
    new_revision_   VARCHAR2(200);

    cnt_            NUMBER := 0;
    info_           VARCHAR2(2000);
    attr_           VARCHAR2(2000);
    objid_          VARCHAR2(2000);
    objversion_     VARCHAR2(2000);
    objstate_       VARCHAR2(200);

    created_        VARCHAR2(200) := 'FALSE';

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
        ORDER  BY substr(part_rev, 1, 1),
              TO_NUMBER(REGEXP_SUBSTR(part_rev, '[0-9]+')) DESC NULLS LAST;

    CURSOR get_revision_object(p_part_no_ IN VARCHAR2, p_part_rev_ IN VARCHAR2) IS
        SELECT objid, objversion
        FROM   &AO.ENG_PART_REVISION
        WHERE  part_no = p_part_no_
        AND    part_rev = p_part_rev_;

    eng_part_revision_rec_ get_eng_part_revision%ROWTYPE;

    new_rev_ VARCHAR2(200);

    FUNCTION Get_New_Revision__(current_revision_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefix VARCHAR2(1);
        num_part VARCHAR2(32767);
        new_num_part VARCHAR2(32767);
        num_value NUMBER;
        num_length PLS_INTEGER;
    BEGIN
        -- Extract prefix and number part using regular expressions
        prefix := regexp_substr(current_revision_, '^[A-Z]');
        num_part := regexp_substr(current_revision_, '[0-9]+');

        -- Check if the numeric part exists and increment it if it does
        IF num_part IS NOT NULL THEN
            num_length := LENGTH(num_part);  -- Store the length of the numeric part
            num_value := to_number(num_part) + 1;

            -- Pad the incremented number to the original length if necessary
            IF LENGTH(to_char(num_value)) < num_length THEN
                new_num_part := lpad(to_char(num_value), num_length, '0');
            ELSE
                new_num_part := to_char(num_value);
            END IF;
        ELSE
            -- If there is no numeric part, start with '01'
            new_num_part := '01';
        END IF;

        -- Return the concatenated result
        RETURN prefix || new_num_part;
    END Get_New_Revision__;

    FUNCTION Prefix_Part_No__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefixed_part_no_ VARCHAR2(100);
        prefix_           VARCHAR2(5) := 'SE';
    BEGIN
        IF ((part_no_ IS NULL) OR (SUBSTR(part_no_, 1, LENGTH(prefix_)) = prefix_) OR ((LENGTH(part_no_) = 7) AND (SUBSTR(part_no_, 1, 1) != '2')) OR (LENGTH(part_no_) != 7)) THEN
            prefixed_part_no_ := part_no_;
        ELSE
            prefixed_part_no_ := prefix_ || part_no_;
        END IF;
        RETURN(prefixed_part_no_);
    END Prefix_Part_No__;

BEGIN
    
    OPEN check_eng_part_master(Prefix_Part_No__(:c01));

        FETCH check_eng_part_master
            INTO cnt_;

    CLOSE check_eng_part_master;

    IF (cnt_ = 0) THEN
        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
        &AO.Client_SYS.Add_To_Attr('PART_NO', Prefix_Part_No__(:c01), attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || Prefix_Part_No__(:c01)), attr_);
        &AO.Client_SYS.Set_Item_Value('UNIT_CODE', &AO.Part_Catalog_API.Get(Prefix_Part_No__(:c01)).unit_code, attr_);
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

        new_revision_ := :c02;
        created_      := 'TRUE';
    ELSE
        OPEN get_latest_revision(Prefix_Part_No__(:c01), :c02);

            FETCH get_latest_revision
                INTO eng_part_revision_rec_;

            current_part_rev_ := eng_part_revision_rec_.PART_REV;

            IF get_latest_revision%FOUND AND SUBSTR(Prefix_Part_No__(:c01), 1, 2) NOT LIKE '16' THEN
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
                    current_part_rev_ := &AO.Eng_Part_Revision_API.Get_Last_Rev(Prefix_Part_No__(:c01));
                END IF;

            END IF;

        CLOSE get_latest_revision;

        IF new_rev_ IS NOT NULL THEN
            &AO.Eng_Part_Revision_API.New_Revision_(Prefix_Part_No__(:c01), new_rev_, current_part_rev_, NULL, NULL);
            created_      := 'TRUE';
        END IF;
    END IF;

    objstate_   := &AO.Eng_Part_Revision_API.Get_Obj_State(Prefix_Part_No__(:c01), new_revision_);

    -- New 16 parts need to get state update, these will not contain children!
    
    IF objstate_ = 'Preliminary' AND SUBSTR(:c01, 1, 2) LIKE '16' THEN
        OPEN get_revision_object(Prefix_Part_No__(:c01), new_revision_);

            FETCH get_revision_object
                INTO objid_, objversion_;

            IF get_revision_object%FOUND THEN
                IF :c18 = 'Released' THEN
                    &AO.ENG_PART_REVISION_API.Set_Active__(info_, objid_, objversion_, attr_, 'DO');
                ELSIF :c18 = 'Obsolete' THEN
                    &AO.ENG_PART_REVISION_API.Set_To_Obsolete__(info_, objid_, objversion_, attr_, 'DO');
                END IF;
            END IF;

        CLOSE get_revision_object;
    END IF;

    :created            := created_;
    :part_rev           := new_revision_;
END;