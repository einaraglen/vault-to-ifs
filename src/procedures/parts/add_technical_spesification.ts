import { Connection } from "@providers/ifs/internal/Connection";
import { MSSQLRow } from "@providers/mssql/types";
import { IFSError } from "@utils/error";
import { convert_to_part, get_bindings, get_bind_keys } from "@utils/tools";

const plsql = `
DECLARE

    CURSOR get_tech_spec_attr(technical_spec_no_ IN NUMBER) IS
        SELECT OBJID,
            OBJVERSION,
            TECHNICAL_SPEC_NO,
            TECHNICAL_CLASS,
            ATTRIB_NUMBER,
            ATTRIBUTE,
            VALUE_TEXT,
            INFO
        FROM   &AO.TECHNICAL_SPEC_ALPHANUM
        WHERE  TECHNICAL_CLASS = 'SEPARTINFO'
        AND    TECHNICAL_SPEC_NO = technical_spec_no_
        ORDER  BY ATTRIB_NUMBER;

    technical_spec_no_ NUMBER;
    attr_              VARCHAR2(32000);
    info_              VARCHAR2(32000);
    objid_             VARCHAR2(32000);
    objversion_        VARCHAR2(32000);

    FUNCTION Prefix_Part_No__(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefixed_part_no_ VARCHAR2(100);
        prefix_           VARCHAR2(5) := 'SE';
    BEGIN
        IF ((part_no_ IS NULL) OR (SUBSTR(part_no_, 1, LENGTH(prefix_)) = prefix_) OR ((LENGTH(part_no_) = 7) AND (SUBSTR(part_no_, 1, 1) != '2')) OR (LENGTH(part_no_) != 7)) THEN
            prefixed_part_no_ := part_no_;
        ELSE
            prefixed_part_no_ := prefix_ || part_no_;
        END IF;
        RETURN(prefixed_part_no_);
    END Prefix_Part_No__;

BEGIN
    technical_spec_no_ := &AO.TECHNICAL_OBJECT_REFERENCE_API.Get_Technical_Spec_No('PartCatalog', 'PART_NO=' || Prefix_Part_No__(:c01) || '^');
    
    -- QUERY FIX
    :temp := technical_spec_no_;

    IF technical_spec_no_ = -1 THEN
        attr_ := NULL;
        &AO.Client_SYS.Add_To_Attr('LU_NAME', 'PartCatalog', attr_);
        &AO.Client_SYS.Add_To_Attr('KEY_REF','PART_NO=' || Prefix_Part_No__(:c01) || '^', attr_);
        &AO.Client_SYS.Add_To_Attr('TECHNICAL_SPEC_NO', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('TECHNICAL_CLASS', 'SEPARTINFO', attr_);
        &AO.Client_SYS.Add_To_Attr('OK_YES_NO', &AO.TECHNICAL_OBJ_REF_APPROVED_API.Decode('1'), attr_);
        &AO.Client_SYS.Add_To_Attr('OK_SIGN', '&AO', attr_);
        &AO.Client_SYS.Add_To_Attr('DT_OK', TRUNC(SYSDATE), attr_);
        &AO.TECHNICAL_OBJECT_REFERENCE_API.NEW__(info_, objid_, objversion_, attr_, 'DO');
        technical_spec_no_ := &AO.Client_SYS.Get_Item_Value('TECHNICAL_SPEC_NO', attr_);
    END IF;
    FOR r_ IN get_tech_spec_attr(technical_spec_no_) LOOP
        attr_ := NULL;
        IF r_.attribute = 'SE_INTDESC' THEN
            &AO.Client_SYS.Add_To_Attr('INFO', SUBSTR(:c09, 1, 2000), attr_);
        ELSIF r_.attribute = 'SE_CAT1' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c11, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CAT2' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c12, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CAT3' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c13, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CAT4' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c14, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CRITIC_ITEM' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c20, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_LLI' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c21, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_MATCERT' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c10, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_MATERIAL' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c23, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_PROJECT' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c24, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_SERIAL_NO' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c17, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_SPARE_PART' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c15, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_SUPP_PARTNO' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c22, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_VENDOR_NAME' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c16, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CREATED_BY' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(:c31, 1, 20), attr_);
        ELSIF r_.attribute = 'SE_CREATED_DATE' THEN
            &AO.Client_SYS.Add_To_Attr('VALUE_TEXT', SUBSTR(to_char(to_date(:c32, 'yyyy-mm-dd hh24:mi:ss"Z"'), 'yyyy-mm-dd'), 1, 20), attr_);
        END IF;
        IF attr_ IS NOT NULL AND NOT &AO.TECHNICAL_OBJECT_REFERENCE_API.Check_Approved(technical_spec_no_) THEN
            &AO.TECHNICAL_SPEC_ALPHANUM_API.Modify__(info_, r_.objid, r_.objversion, attr_, 'DO');
        END IF;
    END LOOP;
END;
`;

export const add_technical_spesification = async (client: Connection, row: MSSQLRow) => {
  const message = convert_to_part(row);
  const bind = get_bindings(message, get_bind_keys(plsql));

  const res = await client.PlSql(plsql, { ...bind, temp: "" });

  if (!res.ok) {
    throw new IFSError(res.errorText, "Add Technical Spesification", row);
  }

  return res;
};
