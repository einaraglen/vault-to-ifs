import { Connection } from "../../providers/ifs/internal/Connection";
import { InMessage, get_bind_keys, get_bindings } from "../../utils";

const plsql = `
DECLARE

CURSOR Get_Prev_Rev(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2 ) IS
    SELECT part_rev
    FROM ifsapp.eng_part_revision
    WHERE part_no = part_no_
    AND rev_no < (select rev_no FROM ifsapp.eng_part_revision
    WHERE part_no = part_no_
    and part_rev = part_rev_ );

prev_part_rev_ VARCHAR2(200);

PROCEDURE Check_Level( part_no_ IN VARCHAR2,
    part_rev_ IN VARCHAR2,
    prev_part_rev_ IN VARCHAR2 ) IS

    CURSOR get_rev IS
        SELECT a.*,
        ifsapp.ENG_PART_STRUCTURE_API.Number_Of_Children_(SUB_PART_NO,SUB_PART_REV) num_children
        FROM IFSAPP.ENG_PART_STRUCTURE a
        WHERE part_no = part_no_
        AND part_rev = part_rev_;

    CURSOR get_partrev IS
        SELECT a.*
        FROM IFSAPP.ENG_PART_REVISION a
        WHERE part_no = part_no_
        AND part_rev = part_rev_;

    -- ADDED
    CURSOR get_prev_added(  part_no_ IN VARCHAR2,
        prev_part_rev_ IN VARCHAR2,
        sub_part_no_ IN VARCHAR2,
        sub_part_rev_ IN VARCHAR2 )  IS
        SELECT * 
        FROM IFSAPP.ENG_PART_STRUCTURE a
        WHERE part_no = part_no_
        AND part_rev = prev_part_rev_
        AND sub_part_no = sub_part_no_;

    -- REVISION_CHANGED
    CURSOR get_prev_rev_chg(  part_no_ IN VARCHAR2,
        prev_part_rev_ IN VARCHAR2,
        sub_part_no_ IN VARCHAR2,
        sub_part_rev_ IN VARCHAR2 )  IS
        SELECT * 
        FROM IFSAPP.ENG_PART_STRUCTURE a
        WHERE part_no = part_no_
        AND SUBSTR(part_rev,1,1) = SUBSTR(prev_part_rev_,1,1)
        AND sub_part_no = sub_part_no_
        AND SUBSTR(sub_part_rev,1,1) != SUBSTR(sub_part_rev_,1,1);

    -- REVISION_CHANGED
    CURSOR get_prev_qty(  part_no_ IN VARCHAR2,
        prev_part_rev_ IN VARCHAR2,
        sub_part_no_ IN VARCHAR2,
        sub_part_rev_ IN VARCHAR2,
        sub_qty_ IN NUMBER )  IS
        SELECT * 
        FROM IFSAPP.ENG_PART_STRUCTURE a
        WHERE part_no = part_no_
        AND part_rev = prev_part_rev_
        AND sub_part_no = sub_part_no_
        AND sub_part_rev = sub_part_rev_
        AND qty != sub_qty_;

    found_ BOOLEAN := FALSE;
    rev_changed_ BOOLEAN := FALSE;
    prev_sub_rev_ VARCHAR2(2000);
    info_ VARCHAR2(2000);
    objid_ VARCHAR2(2000);
    objversion_ VARCHAR2(2000);
    objstate_ VARCHAR2(2000);
    attr_ VARCHAR2(2000);

BEGIN
    FOR r_ IN get_rev LOOP
        FOR p_ IN get_partrev LOOP
            objstate_ := p_.objstate;
        END LOOP;

        :temp := objstate_;

        IF objstate_ = 'Active' Then

        RAISE VALUE_ERROR;
            /*
            UPDATE ifsapp.eng_part_revision_tab
            SET rowstate = 'Preliminary'
            WHERE part_no = r_.part_no
            AND part_rev = r_.part_rev;
            */
        END IF;

        rev_changed_ := FALSE;
        prev_sub_rev_ := '';
        found_ := FALSE;

        FOR a_ IN get_prev_added( r_.part_no, prev_part_rev_, r_.sub_part_no, r_.sub_part_rev ) LOOP
            found_ := TRUE;
        END LOOP;

        IF NOT (found_) THEN

            attr_ := NULL;
            IFSAPP.Client_SYS.Add_To_Attr('STR_COMMENT','ADDED',attr_);
            IFSAPP.ENG_PART_STRUCTURE_API.Modify__( info_, r_.objid, r_.objversion, attr_, 'DO');

        ELSE

            FOR a_ IN get_prev_rev_chg( r_.part_no, prev_part_rev_, r_.sub_part_no, r_.sub_part_rev ) LOOP
                found_ := TRUE;
                attr_ := NULL;
                prev_sub_rev_ := a_.sub_part_rev;
                rev_changed_ := TRUE;
                IFSAPP.Client_SYS.Add_To_Attr('STR_COMMENT','REVISION_CHANGED',attr_);
                IFSAPP.ENG_PART_STRUCTURE_API.Modify__( info_, r_.objid, r_.objversion, attr_, 'DO');
            END LOOP;

            IF NOT ( found_ ) THEN

                FOR a_ IN get_prev_qty( r_.part_no, prev_part_rev_, r_.sub_part_no, r_.sub_part_rev, r_.qty ) LOOP
                    found_ := TRUE;
                    attr_ := NULL;
                    IFSAPP.Client_SYS.Add_To_Attr('STR_COMMENT','QTY_CHANGED',attr_);
                    IFSAPP.ENG_PART_STRUCTURE_API.Modify__( info_, r_.objid, r_.objversion, attr_, 'DO');
                END LOOP;

            END IF;

            /*
            IF objstate_ = 'Active' THEN
                &AO.ENG_PART_REVISION_API.Set_Active(r_.part_no, r_.part_rev);
            END IF;
            */
        END IF;

        IF r_.num_children > 0 THEN

            IF rev_changed_ THEN

                Check_Level( r_.sub_part_no, r_.sub_part_rev, prev_sub_rev_ );

            END IF;

        END IF;

    END LOOP;
END;

BEGIN
    OPEN get_prev_rev(:c02, :c03); 

    FETCH get_prev_rev 
        INTO prev_part_rev_;
    
    CLOSE get_prev_rev;
    
    IF prev_part_rev_ IS NOT NULL THEN

        Check_Level(:c02, :c03, prev_part_rev_);
        
    END IF;
END;
`;

export const create_change_log = async (client: Connection, message: InMessage) => {
  const bind = get_bindings(message, get_bind_keys(plsql));

  const res = await client.PlSql(plsql, { ...bind, temp: "" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};
