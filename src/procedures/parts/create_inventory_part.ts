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
    weight_net_ NUMBER := 0;

    CURSOR check_inventory_part(part_ IN VARCHAR2, contr_ IN VARCHAR2) IS
        SELECT COUNT(1)
        FROM   &AO.INVENTORY_PART 
        WHERE  part_no = part_
        AND    contract = contr_;

    CURSOR invpart_get_version(part_ IN VARCHAR2) IS
        SELECT objid, objversion
        FROM   &AO.INVENTORY_PART
        WHERE  contract = contract_
        AND    part_no = part_;

    CURSOR invpart_get_rev(part_ IN VARCHAR2) IS
        SELECT objid, objversion
        FROM   &AO.PART_REVISION
        WHERE  contract = contract_
        AND    part_no = part_
        AND    eng_chg_level = 1;

    PROCEDURE Set_Weight_Net( part_no_ IN VARCHAR2, weight_net_ IN NUMBER )  IS
        attr_       VARCHAR2(2000);
        info_       VARCHAR2(2000);
        objid_      VARCHAR2(2000);
        objversion_ VARCHAR2(2000);
        uom_for_weight_net_  VARCHAR2(50);

        CURSOR get_part IS
            SELECT objid, objversion, uom_for_weight_net
            FROM &AO.PART_CATALOG p
            WHERE part_no = part_no_;   
            
        BEGIN 
            OPEN get_part;
                FETCH get_part INTO objid_, objversion_, uom_for_weight_net_;
            CLOSE get_part;

            &AO.Client_SYS.Add_To_Attr('WEIGHT_NET', weight_net_, attr_);

            IF uom_for_weight_net_ IS NULL THEN 
                &AO.Client_SYS.Add_To_Attr('UOM_FOR_WEIGHT_NET', 'kg', attr_);
            END IF;
            
            &AO.PART_CATALOG_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
    END Set_Weight_Net;

BEGIN
    OPEN check_inventory_part(:c01, contract_);
    FETCH check_inventory_part
        INTO cnt_;
    CLOSE check_inventory_part;

    DECLARE
        mass_g_ VARCHAR2(200) := :c25;
        test_   NUMBER := 0;
        ok_     BOOLEAN := FALSE;
    BEGIN
        BEGIN
            test_ := TO_NUMBER(mass_g_);
            ok_   := TRUE;
        EXCEPTION
            WHEN OTHERS THEN
                ok_ := FALSE;
        END;

        IF NOT (ok_) THEN
            BEGIN
                test_ := TO_NUMBER(REPLACE(mass_g_, ',', '.'));
                ok_   := TRUE;
            EXCEPTION
                WHEN OTHERS THEN
                    ok_ := FALSE;
            END;
        END IF;

        IF NOT (ok_) THEN
            BEGIN
                test_ := TO_NUMBER(REPLACE(mass_g_, '.', ','));
                ok_   := TRUE;
                EXCEPTION
                    WHEN OTHERS THEN
                        ok_ := FALSE;
            END;
        END IF;

        IF test_ > 0 THEN
            weight_net_ := test_ / 1000;
        END IF;
    END;

    IF (cnt_ = 0) THEN
        &AO.Client_SYS.Clear_Attr(attr_);

        IF :c18 = 'Obsolete' THEN
            &AO.Client_SYS.Add_To_Attr('PART_STATUS', 'I', attr_);
        ELSE
            &AO.Client_SYS.Add_To_Attr('PART_STATUS', 'A', attr_);
        END IF;

        &AO.Client_SYS.Add_To_Attr('CONTRACT', contract_, attr_);
        &AO.Client_SYS.Add_To_Attr('ASSET_CLASS', 'S', attr_);
        &AO.Client_SYS.Add_To_Attr('STOCK_MANAGEMENT_DB', 'SYSTEM MANAGED INVENTORY', attr_);
        &AO.Client_SYS.Add_To_Attr('DOP_CONNECTION',
        &AO.DOP_CONNECTION_API.Decode('MAN'),attr_);
        &AO.Client_SYS.Add_To_Attr('DOP_NETTING', &AO.DOP_NETTING_API.Decode('NETT'), attr_);
        &AO.Client_SYS.Add_To_Attr('PLANNER_BUYER', '*', attr_);
        &AO.Client_SYS.Add_To_Attr('CYCLE_PERIOD', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('CYCLE_CODE_DB', 'N', attr_);
        &AO.Client_SYS.Add_To_Attr('MANUF_LEADTIME', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('PURCH_LEADTIME', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('EXPECTED_LEADTIME', 0, attr_);

        Set_Weight_Net(:c01, weight_net_);
        &AO.Client_SYS.Add_To_Attr('SUPPLY_CODE',
        &AO.MATERIAL_REQUIS_SUPPLY_API.Decode('IO'), attr_);
        &AO.Client_SYS.Add_To_Attr('TYPE_CODE',
        &AO.INVENTORY_PART_TYPE_API.Decode('4'), attr_);

        IF SUBSTR(:c01, 1, 2) = '20' THEN 
            &AO.Client_SYS.Add_To_Attr('ZERO_COST_FLAG', &AO.INVENTORY_PART_ZERO_COST_API.Decode('O'), attr_);
        ELSE
            &AO.Client_SYS.Add_To_Attr('ZERO_COST_FLAG', &AO.INVENTORY_PART_ZERO_COST_API.Decode('N'), attr_);
        END IF;
        
        &AO.Client_SYS.Add_To_Attr('LEAD_TIME_CODE', &AO.INV_PART_LEAD_TIME_CODE_API.Decode('P'), attr_);
        &AO.Client_SYS.Add_To_Attr('AVAIL_ACTIVITY_STATUS', &AO.INVENTORY_PART_AVAIL_STAT_API.Decode('CHANGED'), attr_);

        IF :c10 = '3.1' THEN
            &AO.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
        ELSIF :c10 = '3.2' THEN
            &AO.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
        END IF;

        &AO.Client_SYS.Add_To_Attr('ESTIMATED_MATERIAL_COST', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('PART_NO', :c01, attr_);
        &AO.Client_SYS.Add_To_Attr('UNIT_MEAS', :c03, attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', NVL(:c07, 'Description does not exist in Vault for article ' || :c01), attr_);
        &AO.Client_SYS.Add_To_Attr('OE_ALLOC_ASSIGN_FLAG_DB', 'N', attr_);
        &AO.Client_SYS.Add_To_Attr('ONHAND_ANALYSIS_FLAG_DB', 'N', attr_);
        &AO.Client_SYS.Add_To_Attr('SHORTAGE_FLAG_DB', 'N', attr_);
        &AO.Client_SYS.Add_To_Attr('FORECAST_CONSUMPTION_FLAG_DB', 'NOFORECAST', attr_);
        &AO.Client_SYS.Add_To_Attr('STOCK_MANAGEMENT_DB', 'SYSTEM MANAGED INVENTORY', attr_);
        &AO.Client_SYS.Add_To_Attr('INVENTORY_VALUATION_METHOD_DB', 'ST', attr_);
        &AO.Client_SYS.Add_To_Attr('NEGATIVE_ON_HAND_DB', 'NEG ONHAND OK', attr_);
        &AO.Client_SYS.Add_To_Attr('INVOICE_CONSIDERATION_DB', 'IGNORE INVOICE PRICE', attr_);
        &AO.Client_SYS.Add_To_Attr('INVENTORY_PART_COST_LEVEL_DB', 'COST PER PART', attr_);
        &AO.Client_SYS.Add_To_Attr('EXT_SERVICE_COST_METHOD_DB', 'EXCLUDE SERVICE COST', attr_);
        &AO.Client_SYS.Add_To_Attr('AUTOMATIC_CAPABILITY_CHECK_DB', 'NO AUTOMATIC CAPABILITY CHECK', attr_);
        &AO.Client_SYS.Add_To_Attr('CO_RESERVE_ONH_ANALYS_FLAG_DB', 'N', attr_);
        
        IF (NVL(:c17, 'N') = 'Y') THEN
            &AO.Client_SYS.Add_To_Attr('QTY_CALC_ROUNDING', 0, attr_);
        ELSE
            &AO.Client_SYS.Add_To_Attr('QTY_CALC_ROUNDING', 16, attr_);
        END IF;

        &AO.Client_SYS.Set_Item_Value('CONTRACT', contract_, attr_);
        &AO.INVENTORY_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');

        attr_ := NULL;

        OPEN invpart_get_rev(:c01);

        FETCH invpart_get_rev
            INTO objid_, objversion_;
        CLOSE invpart_get_rev;
   
        &AO.Client_SYS.Add_To_Attr('EFF_PHASE_IN_DATE', SYSDATE - 6 * 30, attr_);
        &AO.PART_REVISION_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
    ELSE
        OPEN invpart_get_version(:c01);

        FETCH invpart_get_version
            INTO objid_, objversion_;
        CLOSE invpart_get_version;

        -- QUERY FIX
        :temp := objid_;
        :temp := objversion_;

        &AO.Client_SYS.Clear_Attr(attr_);

        Set_Weight_Net(:c01, weight_net_);

        IF :c10 = '3.1' THEN
            &AO.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
        ELSIF :c10 = '3.2' THEN
            &AO.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
        END IF;

        &AO.INVENTORY_PART_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
    END IF;
END;
`;

export const create_inventory_part = async (client: Connection, message: InMessage) => {
  const bind = get_bindings(message, get_bind_keys(plsql));

  const res = await client.PlSql(plsql, { ...bind, temp: "" });

  if (!res.ok) {
    throw Error(res.errorText);
  }

  return res;
};
