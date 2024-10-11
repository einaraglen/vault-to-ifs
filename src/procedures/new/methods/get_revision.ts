const Get_Revision = `
    FUNCTION Get_Revision(current_revision_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefix VARCHAR2(1);
        num_part VARCHAR2(32767);
        new_num_part VARCHAR2(32767);
        num_value NUMBER;
        num_length PLS_INTEGER;
    BEGIN
        prefix := regexp_substr(current_revision_, '^[A-Z]');
        num_part := regexp_substr(current_revision_, '[0-9]+');

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
    END Get_Revision;
`