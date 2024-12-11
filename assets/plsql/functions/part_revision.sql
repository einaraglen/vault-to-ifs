FUNCTION Part_Revision__(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2) RETURN REV_REV IS
    result REV_REV;

    CURSOR get_latest_revision(p_part_no_ IN VARCHAR2, p_part_rev_ IN VARCHAR2) IS
        SELECT *
        FROM   &AO.ENG_PART_REVISION
        WHERE  part_no = p_part_no_
        AND    substr(part_rev, 1, 1) = SUBSTR(p_part_rev_, 1, 1)
        ORDER  BY substr(part_rev, 1, 1),
              TO_NUMBER(REGEXP_SUBSTR(part_rev, '[0-9]+')) DESC NULLS LAST;

    eng_part_revision_rec_ get_latest_revision%ROWTYPE;

    FUNCTION Get_New_Revision__(part_rev_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefix VARCHAR2(1);
        num_part VARCHAR2(32767);
        new_num_part VARCHAR2(32767);
        num_value NUMBER;
        num_length PLS_INTEGER;
    BEGIN
        prefix := regexp_substr(part_rev_, '^[A-Z]');
        num_part := regexp_substr(part_rev_, '[0-9]+');

        IF num_part IS NOT NULL THEN
            num_length := LENGTH(num_part);
            num_value := to_number(num_part) + 1;

            IF LENGTH(to_char(num_value)) < num_length THEN
                new_num_part := lpad(to_char(num_value), num_length, '0');
            ELSE
                new_num_part := to_char(num_value);
            END IF;
        ELSE
            new_num_part := '01';
        END IF;

        RETURN prefix || new_num_part;
    END Get_New_Revision__;

BEGIN

    OPEN get_latest_revision(part_no_, part_rev_);

            FETCH get_latest_revision
                INTO eng_part_revision_rec_;

            result.current_part_rev_ := eng_part_revision_rec_.PART_REV;

            IF get_latest_revision%FOUND AND SUBSTR(part_no_, 1, 2) NOT LIKE '16' THEN
                -- Use last revision to calculate next revision
                result.new_rev_      := Get_New_Revision__(result.current_part_rev_);
                result.new_revision_ := result.new_rev_;
            ELSIF get_latest_revision%FOUND AND SUBSTR(part_no_, 1, 2) LIKE '16' THEN
                -- Parts start with 16 and this revision exists. Do not create a new... */
                IF result.current_part_rev_ != part_rev_ THEN
                    result.new_rev_      := NULL;
                    result.new_revision_ := result.current_part_rev_;
                ELSE
                    result.new_rev_      := NULL;
                    result.new_revision_ := part_rev_;
                END IF;
            ELSE
                -- This is the first revision for this letter
                result.new_rev_      := part_rev_;
                result.new_revision_ := result.new_rev_;

                IF result.current_part_rev_ IS NULL THEN
                    result.current_part_rev_ := &AO.Eng_Part_Revision_API.Get_Last_Rev(part_no_);
                END IF;
            END IF;

        CLOSE get_latest_revision;

    RETURN result;

END Part_Revision__;

