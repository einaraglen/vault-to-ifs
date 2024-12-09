DECLARE

    info_ VARCHAR2(2000);
    attr_ VARCHAR2(2000);

    CURSOR parent_cursor IS
        SELECT DISTINCT
            PC.OBJID,
            PC.OBJVERSION
        FROM
            &AO.ENG_PART_STRUCTURE EPS
        JOIN 
            &AO.PART_CATALOG PC 
            ON PC.PART_NO = EPS.PART_NO
            AND PC.ENG_SERIAL_TRACKING_CODE_DB != 'SERIAL TRACKING'
        START WITH 
            EPS.SUB_PART_NO = :part_no
            AND EPS.SUB_PART_REV = :part_rev
        CONNECT BY PRIOR 
            EPS.PART_NO = EPS.SUB_PART_NO 
            AND PRIOR EPS.PART_REV = EPS.SUB_PART_REV;

    parent_ parent_cursor%ROWTYPE;

BEGIN

    OPEN parent_cursor;

    LOOP

        FETCH parent_cursor INTO parent_;
        EXIT WHEN parent_cursor%NOTFOUND;

        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.Client_SYS.Add_To_Attr('ALLOW_AS_NOT_CONSUMED_DB', 'TRUE', attr_);
        &AO.Client_SYS.Add_To_Attr('ENG_SERIAL_TRACKING_CODE_DB', 'SERIAL TRACKING', attr_);

        &AO.PART_CATALOG_API.Modify__(info_, parent_.OBJID, parent_.OBJVERSION, attr_, 'DO');

    END LOOP;

    CLOSE parent_cursor;

    :ok := 'true';

END;






