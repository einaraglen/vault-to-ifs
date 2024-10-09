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

export const get_misc_part_data = async (client: Connection) => {
  const plsql = `
        DECLARE
                info_           VARCHAR2(2000);
                attr_           VARCHAR2(2000);
                objid_          VARCHAR2(2000);
                objversion_     VARCHAR2(2000);

                site_           VARCHAR2(100);
                vendor_         VARCHAR2(100);
                supply_         VARCHAR2(100);
                rental_         VARCHAR2(100);
                ownership_      VARCHAR2(100);

                temp_           VARCHAR2(100);
                rev_            VARCHAR2(100);

            BEGIN
                site_       := &AO.PROJECT_MISC_PROCUREMENT_API.Get_Default_Site__(:prj_id);

                &AO.Project_Misc_Procurement_API.Get_Part_Data(
                    temp_,
                    vendor_,
                    rental_,
                    supply_,
                    temp_,
                    ownership_,
                    :part_no,
                    site_,
                    :prj_id,
                    :act_seq,
                    'FALSE'
                );

                &AO.Client_SYS.Clear_Attr(attr_);

                &AO.Client_SYS.Add_To_Attr('PROJECT_ID', :prj_id, attr_);   
                &AO.Client_SYS.Add_To_Attr('ACTIVITY_SEQ', :act_seq, attr_);  

                &AO.Client_SYS.Add_To_Attr('SITE', site_, attr_);    

                &AO.Client_SYS.Add_To_Attr('PART_NO', :part_no, attr_);    

                &AO.Client_SYS.Add_To_Attr('REQUIRE_QTY', :qty, attr_);   

                &AO.Client_SYS.Add_To_Attr('SUPPLY_OPTION', supply_, attr_);    
                &AO.Client_SYS.Add_To_Attr('STD_PLANNED_ITEM', 0, attr_);    
                &AO.Client_SYS.Add_To_Attr('NETTING', 1, attr_);  
                &AO.Client_SYS.Add_To_Attr('OFFSET', 1, attr_);    

                &AO.Client_SYS.Add_To_Attr('VENDOR_NO', vendor_, attr_);  

                &AO.Client_SYS.Add_To_Attr('CURRENCY_CODE', 'NOK', attr_);    
                &AO.Client_SYS.Add_To_Attr('PART_OWNERSHIP', ownership_, attr_);    
                &AO.Client_SYS.Add_To_Attr('RESERVE_AT_RECEIPT', 0, attr_);    
                &AO.Client_SYS.Add_To_Attr('RENTAL_DB', 'FALSE', attr_);    


                -- TODO: USE THIS NOW 
                -- THIS SHIT WORKS WOHOOOO
                rev_ := &AO.Eng_Part_Revision_API.Get_Last_Rev(:parent_no);

                &AO.Client_SYS.Add_To_Attr('C_PARENT_PART_NO', :parent_no, attr_);    
                &AO.Client_SYS.Add_To_Attr('C_PARENT_PART_REV', rev_, attr_);    

                &AO.PROJECT_MISC_PROCUREMENT_API.NEW__(info_, objid_, objversion_, attr_, 'DO');

                :temp := ownership_;

            END;
    `;

  const res = await client.PlSql(plsql, {
    part_no: "16000346",
    qty: "1",
    parent_no: "SE2100375",
    prj_id: "EIA-TEST",
    act_seq: "101350490",
    temp: ""
  });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  const test = res.bindings as any;
  console.log(test)
  return test;
};

export const update_misc_quantity = async (client: Connection) => {
  const plsql = `
        DECLARE
                info_           VARCHAR2(2000);
                attr_           VARCHAR2(2000);
                objid_          VARCHAR2(2000);
                objversion_     VARCHAR2(2000);

                CURSOR get_misc_line(objid_ IN VARCHAR2) IS
                    SELECT 
                        objid, objversion 
                    FROM &AO.PROJECT_MISC_PROCUREMENT_CFV 
                    WHERE 
                        objid LIKE objid_;
            BEGIN
              OPEN get_misc_line(:objid);
                FETCH get_misc_line INTO objid_, objversion_;
              CLOSE get_misc_line;
              
              &AO.Client_SYS.Clear_Attr(attr_);
              &AO.Client_SYS.Add_To_Attr('REQUIRE_QTY', :qty, attr_);  

              &AO.PROJECT_MISC_PROCUREMENT_API.MODIFY__(info_, objid_, objversion_, attr_, 'DO');

              :temp := objid_;
            END;
    `;

  const res = await client.PlSql(plsql, {
    objid: "AAAVwOAAOAAOE6QAAW",
    qty: "5",
    temp: ""
  });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  console.log(res.bindings)
};

export const remove_misc_line = async (client: Connection) => {
  const plsql = `
        DECLARE
                info_           VARCHAR2(2000);
                objid_          VARCHAR2(2000);
                objversion_     VARCHAR2(2000);

                CURSOR get_misc_line(objid_ IN VARCHAR2) IS
                    SELECT 
                        objid, objversion 
                    FROM &AO.PROJECT_MISC_PROCUREMENT_CFV 
                    WHERE 
                        objid LIKE objid_;
            BEGIN
              OPEN get_misc_line(:objid);
                FETCH get_misc_line INTO objid_, objversion_;
              CLOSE get_misc_line;
              
              &AO.PROJECT_MISC_PROCUREMENT_API.REMOVE__(info_, objid_, objversion_, 'DO');

              :temp := objid_;
            END;
    `;

  const res = await client.PlSql(plsql, {
    objid: "AAAVwOAAOAAOE6QAAV",
    temp: ""
  });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  console.log(res.bindings)
};

export const test_get_engineering = async (client: Connection) => {
  const plsql = `
        DECLARE
                info_           VARCHAR2(2000);
                objid_          VARCHAR2(2000);
                objversion_     VARCHAR2(2000);
                attr_           VARCHAR2(2000);
            BEGIN
              info_ := &AO.Eng_Part_Revision_API.Get(:part_no, :rev).part_rev;
              :temp := info_;
            END;
    `;

  const res = await client.PlSql(plsql, {
    part_no: "SE2143115",
    rev: "D",
    temp: ""
  });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  console.log(res.bindings)
};
