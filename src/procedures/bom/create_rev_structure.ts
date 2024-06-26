import { Connection } from "../../providers/ifs/internal/Connection";
import { get_bind_keys, get_bindings } from "../../utils";

const plsql = `
DECLARE
  info_               VARCHAR2(2000);
  attr_               VARCHAR2(2000);
  objid_              VARCHAR2(2000);
  objversion_         VARCHAR2(2000);

  CURSOR get_rev(part_no_ IN VARCHAR2, part_rev_ IN VARCHAR2) IS
    SELECT objid, objversion
    FROM   ifsapp.ENG_PART_REVISION epr
    WHERE  epr.part_no = part_no_
    AND    epr.part_rev = part_rev_;

BEGIN
  /*
  OPEN get_rev(:part_no, :part_rev);
  FETCH get_rev
    INTO objid_, objversion_;
  CLOSE get_rev;

  IFSAPP.ENG_PART_REVISION_API.Set_Obsolete(:part_no, :part_rev); -- SET_OBSOLETE
  IFSAPP.ENG_PART_REVISION_API.Remove__(info_, objid_, objversion_, 'DO'); -- DELETE
  */

  IFSAPP.ENG_PART_STRUCTURE_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');

  :temp := info_;

  IFSAPP.Client_SYS.Add_To_Attr('STRUCTURE_ID', 'STD', attr_);
  IFSAPP.Client_SYS.Add_To_Attr('PART_NO', :part_no, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('PART_REV', :part_rev, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('SUB_PART_NO', :sub_no, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('SUB_PART_REV', :sub_rev, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('POS', SUBSTR('1',1,10), attr_);
  IFSAPP.Client_SYS.Set_Item_Value('QTY', :qty, attr_);

  IFSAPP.ENG_PART_STRUCTURE_API.New__(info_, objid_, objversion_, attr_, 'DO');

  attr_ := NULL;
  IFSAPP.Client_SYS.Add_To_Attr('PART_NO', :part_no, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('PART_REV', :part_rev, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('SPARE_PART_NO', :sub_no, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('SPARE_PART_REV', :sub_rev, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('QTY', :qty, attr_);
  IFSAPP.Client_SYS.Add_To_Attr('INFO', 'EIA_SPECIAL', attr_);
  IFSAPP.Eng_Part_Spare_API.New__(info_, objid_, objversion_, attr_, 'DO');

END;
`;

export const create_rev_structure = async (client: Connection) => {
  const res = await client.PlSql(plsql, { temp: "", part_no: "SE2102017", part_rev: "B", sub_no: "16100003", sub_rev: "A01", qty: "4" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};
