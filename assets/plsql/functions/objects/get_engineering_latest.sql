FUNCTION Get_Engineering_Latest__(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2) RETURN REV_REC IS
    obj_        REV_REC;
    rev_        VARCHAR2(10);

    last_rev_   VARCHAR2(10);
    new_rev_    VARCHAR2(10);
    created_    BOOLEAN := FALSE;

    CURSOR get_latest_revision_ IS
        SELECT part_rev
        FROM &AO.ENG_PART_REVISION
        WHERE part_no = part_no_
        AND SUBSTR(part_rev, 1, 1) = SUBSTR(part_rev_, 1, 1)
        ORDER BY SUBSTR(part_rev, 1, 1),
              TO_NUMBER(REGEXP_SUBSTR(part_rev, '[0-9]+')) DESC NULLS LAST;
BEGIN
    OPEN get_latest_revision_;
        FETCH get_latest_revision_
            INTO rev_;

        IF get_latest_revision_%NOTFOUND THEN
            -- No revision for this character, create new
            new_rev_ := part_rev_;
            last_rev_ := &AO.Eng_Part_Revision_API.Get_Last_Rev(part_no_);
            created_ := TRUE;
        ELSE
            IF SUBSTR(:c01, 1, 2) LIKE '16' THEN
                -- 16% Parts Always Grab Latest on same character
                new_rev_ := rev_;
            ELSE
                -- SE% Parts Always Create New
                new_rev_ := Get_New_Revision__(rev_);
                last_rev_ := rev_;
                created_ := TRUE;
            END IF;
        END IF;

    CLOSE get_latest_revision_;

    obj_.last_rev := last_rev_;
    obj_.new_rev := new_rev_;
    obj_.created := created_;

    RETURN obj_;
END Get_Engineering_Latest__;