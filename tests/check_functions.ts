
/**
 * Need to make a Revision Generator Function that does not overflow!
 */

import { Connection } from "../src/providers/ifs/internal/Connection";

const plsql = `
DECLARE
    rev_      VARCHAR2(200);

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
BEGIN
        rev_        := Get_New_Revision__(:arg);
        :state      := rev_;
END
`


export const get_new_revision = async (client: Connection, rev: string) => {
    const res = await client.PlSql(plsql, { arg: rev, state: "" });
  
    if (!res.ok) {
      throw Error(res.errorText);
    }

    const { state } = res.bindings as any
  
    return state;
}