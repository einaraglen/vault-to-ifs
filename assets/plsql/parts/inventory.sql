-- NEW

IF rec_.C18 = 'Obsolete' THEN
    IFSAPP.Client_SYS.Add_To_Attr('PART_STATUS', 'I', attr_);
ELSE
    IFSAPP.Client_SYS.Add_To_Attr('PART_STATUS', 'A', attr_);
END IF;

IFSAPP.Client_SYS.Add_To_Attr('CONTRACT', contract_, attr_);
IFSAPP.Client_SYS.Add_To_Attr('ASSET_CLASS', 'S', attr_);
IFSAPP.Client_SYS.Add_To_Attr('STOCK_MANAGEMENT_DB', 'SYSTEM MANAGED INVENTORY', attr_);
IFSAPP.Client_SYS.Add_To_Attr('DOP_CONNECTION', IFSAPP.DOP_CONNECTION_API.Decode('MAN'), attr_);
IFSAPP.Client_SYS.Add_To_Attr('DOP_NETTING', IFSAPP.DOP_NETTING_API.Decode('NETT'), attr_);
IFSAPP.Client_SYS.Add_To_Attr('PLANNER_BUYER', '*', attr_);
IFSAPP.Client_SYS.Add_To_Attr('CYCLE_PERIOD', 0, attr_);
IFSAPP.Client_SYS.Add_To_Attr('CYCLE_CODE_DB', 'N', attr_);
IFSAPP.Client_SYS.Add_To_Attr('MANUF_LEADTIME', 0, attr_);
IFSAPP.Client_SYS.Add_To_Attr('PURCH_LEADTIME', 0, attr_);
IFSAPP.Client_SYS.Add_To_Attr('EXPECTED_LEADTIME', 0, attr_);
IFSAPP.Client_SYS.Add_To_Attr('SUPPLY_CODE', IFSAPP.MATERIAL_REQUIS_SUPPLY_API.Decode('IO'), attr_);
IFSAPP.Client_SYS.Add_To_Attr('TYPE_CODE', IFSAPP.INVENTORY_PART_TYPE_API.Decode('4'), attr_);

IF SUBSTR(rec_.c01, 1, 2) = '20' THEN
    IFSAPP.Client_SYS.Add_To_Attr('ZERO_COST_FLAG', IFSAPP.INVENTORY_PART_ZERO_COST_API.Decode('O'), attr_);
ELSE
    IFSAPP.Client_SYS.Add_To_Attr('ZERO_COST_FLAG', IFSAPP.INVENTORY_PART_ZERO_COST_API.Decode('N'), attr_);
END IF;

IFSAPP.Client_SYS.Add_To_Attr('LEAD_TIME_CODE', IFSAPP.INV_PART_LEAD_TIME_CODE_API.Decode('P'), attr_);
IFSAPP.Client_SYS.Add_To_Attr('AVAIL_ACTIVITY_STATUS', IFSAPP.INVENTORY_PART_AVAIL_STAT_API.Decode('CHANGED'), attr_);

IF rec_.c10 = '3.1' THEN
    IFSAPP.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
ELSIF rec_.c10 = '3.2' THEN
    IFSAPP.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
END IF;

IFSAPP.Client_SYS.Add_To_Attr('ESTIMATED_MATERIAL_COST', 0, attr_);
IFSAPP.Client_SYS.Add_To_Attr('PART_NO', Prefix_Part_No__(rec_.c01), attr_);

-- ALWAYS USE CATALOG UOM
--IFSAPP.Client_SYS.Add_To_Attr('UNIT_MEAS', rec_.C03, attr_);
IFSAPP.Client_SYS.Add_To_Attr('UNIT_MEAS', IFSAPP.PART_CATALOG_API.Get(Prefix_Part_No__(rec_.c01)).unit_code, attr_);

-- TODO: Keep this as some generic desc since main will be from CATALOG?
IFSAPP.Client_SYS.Add_To_Attr('DESCRIPTION', 'Inventory Part', attr_);

IFSAPP.Client_SYS.Add_To_Attr('OE_ALLOC_ASSIGN_FLAG_DB', 'N', attr_);
IFSAPP.Client_SYS.Add_To_Attr('ONHAND_ANALYSIS_FLAG_DB', 'N', attr_);
IFSAPP.Client_SYS.Add_To_Attr('SHORTAGE_FLAG_DB', 'N', attr_);
IFSAPP.Client_SYS.Add_To_Attr('FORECAST_CONSUMPTION_FLAG_DB', 'NOFORECAST', attr_);
IFSAPP.Client_SYS.Add_To_Attr('STOCK_MANAGEMENT_DB', 'SYSTEM MANAGED INVENTORY', attr_);

-- FIX
&AO.Client_SYS.Add_To_Attr('INVENTORY_VALUATION_METHOD', 'Weighted Average', attr_);
&AO.Client_SYS.Add_To_Attr('NEGATIVE_ON_HAND_DB', 'NEG ONHAND NOT OK', attr_);
&AO.Client_SYS.Add_To_Attr('INVOICE_CONSIDERATION', 'Transaction Based', attr_);

IFSAPP.Client_SYS.Add_To_Attr('INVENTORY_PART_COST_LEVEL_DB', 'COST PER PART', attr_);
IFSAPP.Client_SYS.Add_To_Attr('EXT_SERVICE_COST_METHOD_DB', 'EXCLUDE SERVICE COST', attr_);
IFSAPP.Client_SYS.Add_To_Attr('AUTOMATIC_CAPABILITY_CHECK_DB', 'NO AUTOMATIC CAPABILITY CHECK', attr_);
IFSAPP.Client_SYS.Add_To_Attr('CO_RESERVE_ONH_ANALYS_FLAG_DB', 'N', attr_);

IF (NVL(rec_.C17, 'N') = 'Y') THEN
    IFSAPP.Client_SYS.Add_To_Attr('QTY_CALC_ROUNDING', 0, attr_);
ELSE
    IFSAPP.Client_SYS.Add_To_Attr('QTY_CALC_ROUNDING', 16, attr_);
END IF;

IFSAPP.Client_SYS.Set_Item_Value('CONTRACT', contract_, attr_);
IFSAPP.INVENTORY_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');

-- UPDATE
OPEN invpart_get_version(Prefix_Part_No__(rec_.c01));
FETCH invpart_get_version
INTO objid_, objversion_;
CLOSE invpart_get_version;

IFSAPP.Client_SYS.Clear_Attr(attr_);

IF rec_.c10 = '3.1' THEN
    	IFSAPP.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
ELSIF rec_.c10 = '3.2' THEN
    IFSAPP.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
END IF;

IFSAPP.INVENTORY_PART_API.Modify__(info_, objid_, objversion_, attr_, 'DO');