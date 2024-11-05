import { Connection } from "../providers/ifs/internal/Connection";
import { IFSError } from "../utils/error";
import { get_bind_keys, get_bindings } from "../utils/tools";

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
`;

export const get_new_revision = async (client: Connection, rev: string) => {
  const res = await client.PlSql(plsql, { arg: rev, state: "" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  const { state } = res.bindings as any;

  return state;
};

export const get_prefix_part_no = async (client: Connection, part_no: string) => {
  const res = await client.PlSql(`
    DECLARE
      part_no_      VARCHAR2(200);

      FUNCTION Get_Part_No__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
          prefixed_part_no_ VARCHAR2(100);
          prefix_           VARCHAR2(5) := 'SE';
      BEGIN
          IF SUBSTR(part_no_, 1, 1) = '1' OR SUBSTR(part_no_, 1, 2) = 'PD' THEN
              prefixed_part_no_ := part_no_;
          ELSE
              prefixed_part_no_ := prefix_ || part_no_;
          END IF;
          RETURN(prefixed_part_no_);
      END Get_Part_No__;

    BEGIN
            part_no_    := Get_Part_No__(:arg);
            :state      := part_no_;
    END
    `, { arg: part_no, state: "" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  const { state } = res.bindings as any;

  return state;
};

export const test_plsql = async (client: Connection, sql: string, message: any) => {
  const bind = get_bindings(message, get_bind_keys(sql));
  const res = await client.PlSql(sql, { ...bind });

  if (!res.ok) {
    throw new IFSError(res.errorText, "Part Handler Exec", message);
  }
};
