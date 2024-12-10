PROCEDURE Inventory__ IS

    info_           VARCHAR2(2000);
    attr_           VARCHAR2(2000);
    objid_          VARCHAR2(2000);
    objversion_     VARCHAR2(2000);

    CURSOR get_inventory_obj(part_ IN VARCHAR2) IS
        SELECT * 
        FROM &AO.INVENTORY_PART 
        WHERE part_no = part_;

    obj_            get_inventory_obj%ROWTYPE;

BEGIN 

    OPEN get_inventory_obj(Part_Number__(:c01));
    
        FETCH get_inventory_obj INTO obj_;

            IF get_inventory_obj%NOTFOUND THEN
                &AO.Client_SYS.Add_To_Attr('CONTRACT', 'SE', attr_);
                &AO.Client_SYS.Add_To_Attr('ASSET_CLASS', 'S', attr_);
                &AO.Client_SYS.Add_To_Attr('STOCK_MANAGEMENT_DB', 'SYSTEM MANAGED INVENTORY', attr_);
                &AO.Client_SYS.Add_To_Attr('DOP_CONNECTION', &AO.DOP_CONNECTION_API.Decode('MAN'), attr_);
                &AO.Client_SYS.Add_To_Attr('DOP_NETTING', &AO.DOP_NETTING_API.Decode('NETT'), attr_);
                &AO.Client_SYS.Add_To_Attr('PLANNER_BUYER', '*', attr_);
                &AO.Client_SYS.Add_To_Attr('CYCLE_PERIOD', 0, attr_);
                &AO.Client_SYS.Add_To_Attr('CYCLE_CODE_DB', 'N', attr_);
                &AO.Client_SYS.Add_To_Attr('MANUF_LEADTIME', 0, attr_);
                &AO.Client_SYS.Add_To_Attr('PURCH_LEADTIME', 0, attr_);
                &AO.Client_SYS.Add_To_Attr('EXPECTED_LEADTIME', 0, attr_);
                &AO.Client_SYS.Add_To_Attr('SUPPLY_CODE', &AO.MATERIAL_REQUIS_SUPPLY_API.Decode('IO'), attr_);
                &AO.Client_SYS.Add_To_Attr('TYPE_CODE', &AO.INVENTORY_PART_TYPE_API.Decode('4'), attr_);

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
                &AO.Client_SYS.Add_To_Attr('PART_NO', Part_Number__(:c01), attr_);
                &AO.Client_SYS.Add_To_Attr('UNIT_MEAS', &AO.PART_CATALOG_API.Get(Part_Number__(:c01)).unit_code, attr_);
                &AO.Client_SYS.Add_To_Attr('DESCRIPTION', 'Inventory Part', attr_);
                &AO.Client_SYS.Add_To_Attr('OE_ALLOC_ASSIGN_FLAG_DB', 'N', attr_);
                &AO.Client_SYS.Add_To_Attr('ONHAND_ANALYSIS_FLAG_DB', 'N', attr_);
                &AO.Client_SYS.Add_To_Attr('SHORTAGE_FLAG_DB', 'N', attr_);
                &AO.Client_SYS.Add_To_Attr('FORECAST_CONSUMPTION_FLAG_DB', 'NOFORECAST', attr_);
                &AO.Client_SYS.Add_To_Attr('STOCK_MANAGEMENT_DB', 'SYSTEM MANAGED INVENTORY', attr_);

                -- FIX
                &AO.Client_SYS.Add_To_Attr('INVENTORY_VALUATION_METHOD', 'Weighted Average', attr_);
                &AO.Client_SYS.Add_To_Attr('NEGATIVE_ON_HAND_DB', 'NEG ONHAND NOT OK', attr_);
                &AO.Client_SYS.Add_To_Attr('INVOICE_CONSIDERATION', 'Transaction Based', attr_);

                &AO.Client_SYS.Add_To_Attr('INVENTORY_PART_COST_LEVEL_DB', 'COST PER PART', attr_);
                &AO.Client_SYS.Add_To_Attr('EXT_SERVICE_COST_METHOD_DB', 'EXCLUDE SERVICE COST', attr_);
                &AO.Client_SYS.Add_To_Attr('AUTOMATIC_CAPABILITY_CHECK_DB', 'NO AUTOMATIC CAPABILITY CHECK', attr_);
                &AO.Client_SYS.Add_To_Attr('CO_RESERVE_ONH_ANALYS_FLAG_DB', 'N', attr_);

                IF (NVL(:c17, 'N') = 'Y') THEN
                    &AO.Client_SYS.Add_To_Attr('QTY_CALC_ROUNDING', 0, attr_);
                ELSE
                    &AO.Client_SYS.Add_To_Attr('QTY_CALC_ROUNDING', 16, attr_);
                END IF;

                &AO.Client_SYS.Set_Item_Value('CONTRACT', 'SE', attr_);
                &AO.INVENTORY_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');
            ELSE
                IF :c10 = '3.1' THEN
                    &AO.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
                ELSIF :c10 = '3.2' THEN
                    &AO.Client_SYS.Add_To_Attr('TECHNICAL_COORDINATOR_ID', 'MATCERT31', attr_);
                END IF;

                &AO.INVENTORY_PART_API.Modify__(info_, obj_.objid, obj_.objversion, attr_, 'DO');
            END IF;

    CLOSE get_inventory_obj;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20002, 'InventoryPart' || CHR(10) ||SQLERRM);

END Inventory__;