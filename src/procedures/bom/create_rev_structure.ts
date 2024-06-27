import { Connection } from "../../providers/ifs/internal/Connection";
import { InMessage, get_bind_keys, get_bindings } from "../../utils";

const plsql = `
DECLARE
  info_               VARCHAR2(2000);
  attr_               VARCHAR2(2000);
  objid_              VARCHAR2(2000);
  objversion_         VARCHAR2(2000);
  --objstate_           VARCHAR2(200);
  exists_             NUMBER;

  CURSOR check_sub_struct(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2, sub_part_no_ IN VARCHAR2, sub_part_rev_ IN VARCHAR2) IS
    SELECT COUNT(*)
    FROM   ifsapp.ENG_PART_STRUCTURE epr
    WHERE  epr.part_no = part_no_
    AND    epr.part_rev = part_rev_
    AND    epr.sub_part_no = sub_part_no_
    AND    epr.sub_part_rev = sub_part_rev_;

BEGIN
  --objstate_   := IFSAPP.Eng_Part_Revision_API.Get_Obj_State(:c02, :c03);
  :temp       :=  objid_;

  IFSAPP.ENG_PART_STRUCTURE_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
  IFSAPP.Client_SYS.Add_To_Attr('STRUCTURE_ID', 'STD', attr_);
  IFSAPP.Client_SYS.Add_To_Attr('PART_NO', :c02, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('PART_REV', :c03, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('SUB_PART_NO', :c06, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('SUB_PART_REV', :c07, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('POS', SUBSTR(:c04, 1, 10), attr_);
  IFSAPP.Client_SYS.Set_Item_Value('QTY', :n01, attr_);

  IF :c02 NOT LIKE '16%' THEN
    IFSAPP.ENG_PART_STRUCTURE_API.New__(info_, objid_, objversion_, attr_, 'DO');
  ELSE
    OPEN check_sub_struct(:c02, :c03, :c06, :c07);
    FETCH check_sub_struct 
      INTO exists_;
    CLOSE check_sub_struct;

    IF exists_ = 0 THEN
      IFSAPP.ENG_PART_STRUCTURE_API.New__(info_, objid_, objversion_, attr_, 'DO');
    END IF;
  END IF;

  IF :c09 LIKE '1' THEN
    attr_ := NULL;
    IFSAPP.Client_SYS.Add_To_Attr('PART_NO', :c02, attr_);
    IFSAPP.Client_SYS.Add_To_Attr('PART_REV', :c03, attr_);
    IFSAPP.Client_SYS.Add_To_Attr('SPARE_PART_NO', :c06, attr_);
    IFSAPP.Client_SYS.Add_To_Attr('SPARE_PART_REV', :c07, attr_);
    IFSAPP.Client_SYS.Add_To_Attr('QTY', :n01, attr_);
    IFSAPP.Client_SYS.Add_To_Attr('INFO', 'VAULT_SERVER', attr_);
    IFSAPP.Eng_Part_Spare_API.New__(info_, objid_, objversion_, attr_, 'DO');
  END IF;

  /*
  IF objstate_ = 'Active' THEN
    &AO.ENG_PART_REVISION_API.Set_Active(:c02, :c03);
  END IF;
  */
END;
`;

export const create_rev_structure = async (client: Connection, message: InMessage) => {
  const bind = get_bindings(message, get_bind_keys(plsql));

  const res = await client.PlSql(plsql, { ...bind, temp: "" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};
