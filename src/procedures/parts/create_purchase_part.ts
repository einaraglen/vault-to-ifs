import { Connection } from "../../providers/ifs/internal/Connection";
import { get_bind_keys, get_bindings } from "../../utils";
import { InMessage } from "../vault/convert_to_in_message";

const plsql = `
DECLARE
    contract_   VARCHAR2(20) := 'SE';
    cnt_        NUMBER := 0;
    
    info_       VARCHAR2(2000);
    attr_       VARCHAR2(2000);
    objid_      VARCHAR2(2000);
    objversion_ VARCHAR2(2000);

    CURSOR check_purchase_part(part_ IN VARCHAR2, contr_ IN VARCHAR2) IS
        SELECT COUNT(1)
        FROM   &AO.purchase_part
        WHERE  part_no = part_
        AND    contract = contr_;

    CURSOR pur_part_get_version(part_ IN VARCHAR2) IS
        SELECT objid, objversion
        FROM   &AO.purchase_part
        WHERE  contract = contract_
        AND    part_no = part_;

BEGIN
    OPEN check_purchase_part(:c01, contract_);
    
    FETCH check_purchase_part
        INTO cnt_;
    CLOSE check_purchase_part;

    IF (cnt_ = 0) THEN
        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.PURCHASE_PART_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');
        &AO.Client_SYS.Add_To_Attr('PART_NO', :c01, attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || :c01), attr_);
        &AO.Client_SYS.Add_To_Attr('INVENTORY_FLAG_DB', 'Y', attr_);
        &AO.Client_SYS.Add_To_Attr('DEFAULT_BUY_UNIT_MEAS', :c03, attr_);
        &AO.Client_SYS.Add_To_Attr('TAXABLE', 'False', attr_);
        &AO.Client_SYS.Set_Item_Value('CONTRACT', contract_, attr_);
        &AO.PURCHASE_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');
    ELSE
        OPEN pur_part_get_version(:c01);

        FETCH pur_part_get_version
            INTO objid_, objversion_;
        CLOSE pur_part_get_version;

        -- QUERY FIX
        :temp := objid_;
        :temp := objversion_;

        &AO.Client_SYS.Clear_Attr(attr_);
        -- TODO: why do we even care about this condition?
        /*&AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || :c01),  attr_);*/
        &AO.PURCHASE_PART_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
    END IF;
END;
`;

export const create_purchase_part = async (client: Connection, message: InMessage) => {
  const bind = get_bindings(message, get_bind_keys(plsql));

  const res = await client.PlSql(plsql, { ...bind, temp: "" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};
