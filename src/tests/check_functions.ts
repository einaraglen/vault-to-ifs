import { Connection } from "../providers/ifs/internal/Connection";

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

      FUNCTION Prefix_Part_No__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
          prefixed_part_no_ VARCHAR2(100);
          prefix_           VARCHAR2(5) := 'SE';
      BEGIN
          IF SUBSTR(part_no_, 1, 1) = '1' OR SUBSTR(part_no_, 1, 2) = 'PD' THEN
              prefixed_part_no_ := part_no_;
          ELSE
              prefixed_part_no_ := prefix_ || part_no_;
          END IF;
          RETURN(prefixed_part_no_);
      END Prefix_Part_No__;

    BEGIN
            part_no_    := Prefix_Part_No__(:arg);
            :state      := part_no_;
    END
    `, { arg: part_no, state: "" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  const { state } = res.bindings as any;

  return state;
};

export const get_object = async (client: Connection, part_no: string) => {
  const res = await client.PlSql(`
    DECLARE
      info_           VARCHAR2(2000);
      attr_           VARCHAR2(2000);

      CURSOR get_catalog_obj(part_ IN VARCHAR2) IS
        SELECT * FROM &AO.PART_CATALOG WHERE part_no = part_;

      obj_            get_catalog_obj%ROWTYPE;

      BEGIN
      OPEN get_catalog_obj(:arg);
          FETCH get_catalog_obj INTO obj_;
      CLOSE get_catalog_obj;

      :test := obj_.ALLOW_AS_NOT_CONSUMED_DB;

      &AO.Client_SYS.Add_To_Attr('ALLOW_AS_NOT_CONSUMED_DB', 'TRUE', attr_);
      &AO.Client_SYS.Add_To_Attr('ENG_SERIAL_TRACKING_CODE_DB', 'SERIAL TRACKING', attr_);

      --&AO.Client_SYS.Add_To_Attr('ALLOW_AS_NOT_CONSUMED_DB', 'FALSE', attr_);
      --&AO.Client_SYS.Add_To_Attr('ENG_SERIAL_TRACKING_CODE_DB', 'NOT SERIAL TRACKING', attr_);

      &AO.PART_CATALOG_API.Modify__(info_, obj_.OBJID, obj_.OBJVERSION, attr_, 'DO');
    END
    `, { arg: part_no, test: "" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  console.log(res.bindings)
}

export const set_serial_tracking = async (client: Connection, part_no: string, part_rev: string) => {

  const res = await client.PlSql(`
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
                ON PC.PART_NO LIKE EPS.PART_NO
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
    `, { part_no, part_rev, ok: "false" })

  if (!res.ok) {
    throw Error(res.errorText);
  }

  console.log(res.bindings)
}

export const insert_in_message = async (client: Connection, id: string, part_no: string, part_rev: string) => {
  const res = await client.PlSql(`
    DECLARE
        info_ VARCHAR2(2000);
        attr_ VARCHAR2(2000);
        objid_ VARCHAR2(2000);
        objversion_ VARCHAR2(2000);
    BEGIN
       
        &AO.Client_SYS.Add_To_Attr('MESSAGE_ID', 1, attr_ );
        &AO.Client_SYS.Add_To_Attr('CLASS_ID', 'SE_PART_INFO', attr_ );
        &AO.Client_SYS.Add_To_Attr('RECEIVER', 'CONNECT', attr_ );
        &AO.Client_SYS.Add_To_Attr('SENDER', :id, attr_ );
        &AO.Client_SYS.Add_To_Attr('SENDER_MESSAGE_ID', :part_no, attr_ );
        &AO.Client_SYS.Add_To_Attr('APPLICATION_MESSAGE_ID', :part_rev, attr_ );
        &AO.Client_SYS.Add_To_Attr('RECEIVED_TIME', SYSDATE, attr_ );
        &AO.Client_SYS.Add_To_Attr('VERSION', :part_no ||'/'|| :part_rev, attr_ );
        &AO.Client_SYS.Add_To_Attr('CONNECTIVITY_VERSION', '1.0', attr_ );
        &AO.Client_SYS.Add_To_Attr('SENDER_ID', 'SEVA02', attr_ );
        &AO.In_Message_API.New__(info_, objid_, objversion_, attr_, 'DO' );

        :ok := 'true';
    END;
    `, { id, part_no, part_rev, ok: "false" })

  if (!res.ok) {
    throw Error(res.errorText);
  }

  console.log(res.bindings)
}

export const get_in_message = async (client: Connection, id: string) => {
  const res = await client.Sql(`
    SELECT *
    FROM &AO.IN_MESSAGE
      WHERE SENDER = :id
    `, { id })

  if (!res.ok) {
    throw Error(res.errorText);
  }

  console.log(res.result)
}

export const get_parents = async (client: Connection, part_no: string) => {
  const res = await client.Sql(`
    SELECT DISTINCT
                EPS.PART_NO,
                LEVEL
            FROM
                &AO.ENG_PART_STRUCTURE EPS
            JOIN 
                &AO.PART_CATALOG PC 
                ON PC.PART_NO LIKE EPS.PART_NO
                AND PC.ENG_SERIAL_TRACKING_CODE_DB = 'NOT SERIAL TRACKING'
            START WITH 
                EPS.SUB_PART_NO = :part_no
            CONNECT BY PRIOR 
                EPS.PART_NO = EPS.SUB_PART_NO 
                AND PRIOR EPS.PART_REV = EPS.SUB_PART_REV
            ORDER BY LEVEL DESC
    `, { part_no })

  if (!res.ok) {
    throw Error(res.errorText);
  }

  console.log(res.result)
}

export const multi_param_test = async (client: Connection) => {
  const res = await client.PlSql(`
      DECLARE
      BEGIN
        :test := :part_no;
      END;
    `, [{ part_no: "123", test: "" }, { part_no: "321", test: "" }])

  if (!res.ok) {
    throw Error(res.errorText);
  }

  console.log(res.bindings)
}
