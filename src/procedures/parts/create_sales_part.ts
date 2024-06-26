import { Connection } from "../../providers/ifs/internal/Connection";
import { InMessage, get_bind_keys, get_bindings } from "../../utils";

const plsql = `
DECLARE
    contract_   VARCHAR2(20) := 'SE';
    cnt_        NUMBER := 0;

    info_       VARCHAR2(2000);
    attr_       VARCHAR2(2000);
    objid_      VARCHAR2(2000);
    objversion_ VARCHAR2(2000);

    CURSOR check_sales_part(part_ IN VARCHAR2, contr_ IN VARCHAR2) IS
        SELECT COUNT(1)
        FROM   &AO.sales_part
        WHERE  catalog_no = part_
        AND    contract = contr_;

    CURSOR sales_part_get_version(part_ IN VARCHAR2) IS
        SELECT objid, objversion
        FROM   &AO.sales_part
        WHERE  contract = contract_
        AND    catalog_no = part_;

BEGIN
    OPEN check_sales_part(:c01, contract_);

    FETCH check_sales_part
        INTO cnt_;
    CLOSE check_sales_part;

    IF (cnt_ = 0) THEN
        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.Client_SYS.Add_To_Attr('CONTRACT', 'SE', attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_TYPE_DB', 'INV', attr_);
        &AO.Client_SYS.Add_To_Attr('PRIMARY_CATALOG_DB', 'FALSE', attr_);
        &AO.Client_SYS.Add_To_Attr('ACTIVEIND_DB', 'Y', attr_);
        &AO.Client_SYS.Add_To_Attr('BONUS_BASIS_FLAG_DB', 'N', attr_);
        &AO.Client_SYS.Add_To_Attr('BONUS_VALUE_FLAG_DB', 'N', attr_);
        &AO.Client_SYS.Add_To_Attr('CONV_FACTOR', 1, attr_);
        &AO.Client_SYS.Add_To_Attr('PRICE_CONV_FACTOR', 1, attr_);
        &AO.Client_SYS.Add_To_Attr('DATE_ENTERED', SYSDATE, attr_);
        &AO.Client_SYS.Add_To_Attr('CLOSE_TOLERANCE', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('QUICK_REGISTERED_PART_DB', 'FALSE', attr_);
        &AO.Client_SYS.Add_To_Attr('ALLOW_PARTIAL_PKG_DELIV_DB', 'TRUE', attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_NO', :c01, attr_);
        &AO.Client_SYS.Add_To_Attr('PART_NO', :c01, attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_DESC', NVL(:c07, 'Description does not exist in Vault for article ' || :c01), attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_GROUP', 'SE', attr_);
        &AO.Client_SYS.Add_To_Attr('SALES_PRICE_GROUP_ID', 'SE', attr_);
        &AO.Client_SYS.Add_To_Attr('SALES_UNIT_MEAS', :c03, attr_);
        &AO.Client_SYS.Add_To_Attr('ACTIVEIND_DB', 'Y', attr_);
        &AO.Client_SYS.Add_To_Attr('CONV_FACTOR', 1, attr_);
        &AO.Client_SYS.Add_To_Attr('COST', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('LIST_PRICE', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('PRICE_CONV_FACTOR', 1, attr_);
        &AO.Client_SYS.Add_To_Attr('PRICE_UNIT_MEAS', :c03, attr_);
        &AO.Client_SYS.Add_To_Attr('COMPANY', 'SE', attr_);
        &AO.Client_SYS.Add_To_Attr('TAXABLE_DB', 'Use sales tax', attr_);
        &AO.Client_SYS.Add_To_Attr('FEE_CODE', '1', attr_);
        &AO.Client_SYS.Add_To_Attr('CLOSE_TOLERANCE', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('PURCHASE_PART_NO', :c01, attr_);
        &AO.Client_SYS.Add_To_Attr('NON_INV_PART_TYPE_DB', 'GOODS', attr_);
        &AO.Client_SYS.Add_To_Attr('SOURCING_OPTION_DB', 'INVENTORYORDER', attr_);
        &AO.Client_SYS.Add_To_Attr('USE_PRICE_INCL_TAX', &AO.fnd_boolean_api.Decode('FALSE'), attr_);
        &AO.SALES_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');
    ELSE
        OPEN sales_part_get_version(:c01);
        FETCH sales_part_get_version
            INTO objid_, objversion_;
        CLOSE sales_part_get_version;

        -- QUERY FIX
        :temp := objid_;
        :temp := objversion_;

        &AO.Client_SYS.Clear_Attr(attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_DESC', NVL(:c07, 'Description does not exist in Vault for article ' || :c01), attr_);
        &AO.SALES_PART_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
    END IF;
END;
`;

export const create_sales_part = async (client: Connection, message: InMessage) => {
  const bind = get_bindings(message, get_bind_keys(plsql));

  const res = await client.PlSql(plsql, { ...bind, temp: "" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};
