FUNCTION Part_Tracked__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
    tracked_ VARCHAR2(20);
    
    CURSOR tracking_cursor IS
        SELECT ENG_SERIAL_TRACKING_CODE_DB
        FROM &AO.PART_CATALOG
        WHERE part_no = part_no_;
BEGIN
    OPEN tracking_cursor;
        FETCH tracking_cursor INTO tracked_;
    CLOSE tracking_cursor;

    RETURN NVL(tracked_, 'NOT SERIAL TRACKING');
END Part_Tracked__;