PROCEDURE Serial_Tracking__(part_no_ IN VARCHAR2) IS

    info_  VARCHAR2(2000);
    attr_  VARCHAR2(2000);
    count_ NUMBER;

    CURSOR parent_cursor IS
        SELECT DISTINCT
            PC.PART_NO,
            EPS.SUB_PART_NO,
            LEVEL
        FROM
            &AO.ENG_PART_STRUCTURE EPS
        JOIN 
            &AO.PART_CATALOG PC 
            ON PC.PART_NO = EPS.PART_NO
            AND PC.ENG_SERIAL_TRACKING_CODE_DB = 'NOT SERIAL TRACKING'
        START WITH 
            EPS.SUB_PART_NO = part_no_
        CONNECT BY PRIOR 
            EPS.PART_NO = EPS.SUB_PART_NO 
        ORDER BY LEVEL DESC;

        parent_ parent_cursor%ROWTYPE;

        CURSOR get_catalog_obj(part_ IN VARCHAR2) IS
        SELECT * 
        FROM &AO.PART_CATALOG 
        WHERE part_no = part_;

        obj_            get_catalog_obj%ROWTYPE;

BEGIN 

    OPEN parent_cursor;

        LOOP

            FETCH parent_cursor INTO parent_;
            EXIT WHEN parent_cursor%NOTFOUND;

            OPEN get_catalog_obj(parent_.PART_NO);
                FETCH get_catalog_obj INTO obj_;

                -- Stupid check, but the data moves fast so need it...
                IF obj_.ENG_SERIAL_TRACKING_CODE_DB = 'NOT SERIAL TRACKING' THEN
                    &AO.Client_SYS.Clear_Attr(attr_);
                    &AO.Client_SYS.Add_To_Attr('ALLOW_AS_NOT_CONSUMED_DB', 'TRUE', attr_);
                    &AO.Client_SYS.Add_To_Attr('ENG_SERIAL_TRACKING_CODE_DB', 'SERIAL TRACKING', attr_);

                    &AO.PART_CATALOG_API.Modify__(info_, obj_.OBJID, obj_.OBJVERSION, attr_, 'DO');
                END IF;

            CLOSE get_catalog_obj;

        END LOOP;

    CLOSE parent_cursor;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20002, 'Failed to change parent to serial PARENT=' || parent_.PART_NO || ', CHILD=' || parent_.SUB_PART_NO || CHR(10) || SQLERRM);

END Serial_Tracking__;