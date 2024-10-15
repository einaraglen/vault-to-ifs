export const Create_Sales_Part = `
    PROCEDURE Create_Sales_Part IS
        info_           VARCHAR2(2000);
        attr_           VARCHAR2(2000);
        objid_          VARCHAR2(2000);
        objversion_     VARCHAR2(2000);

        CURSOR get_sales_part(part_ IN VARCHAR2) IS
            SELECT objid, objversion
            FROM &AO.sales_part
            WHERE contract = 'SE'
            AND catalog_no = part_;
    BEGIN
    OPEN get_sales_part(Get_Part_No(:c01));
            FETCH get_sales_part
                INTO objid_, objversion_;

            IF get_sales_part%NOTFOUND THEN
                &AO.SALES_PART_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');

                &AO.Client_SYS.Add_To_Attr('COMPANY', 'SE', attr_);
                &AO.Client_SYS.Add_To_Attr('CATALOG_GROUP', 'SE', attr_);
                &AO.Client_SYS.Add_To_Attr('SALES_PRICE_GROUP_ID', 'SE', attr_);

                &AO.Client_SYS.Add_To_Attr('LIST_PRICE', 0, attr_);
                &AO.Client_SYS.Add_To_Attr('CATALOG_TYPE_DB', 'INV', attr_);
                &AO.Client_SYS.Add_To_Attr('SOURCING_OPTION_DB', 'INVENTORYORDER', attr_);

                &AO.Client_SYS.Add_To_Attr('CATALOG_DESC', &AO.PART_CATALOG_API.Get_Description(Get_Part_No(:c01)), attr_);
                &AO.Client_SYS.Add_To_Attr('SALES_UNIT_MEAS', &AO.PART_CATALOG_API.Get_Unit_Code(Get_Part_No(:c01)), attr_);

                &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No(:c01), attr_);
                &AO.Client_SYS.Add_To_Attr('CATALOG_NO', Get_Part_No(:c01), attr_);
                &AO.Client_SYS.Add_To_Attr('PURCHASE_PART_NO', Get_Part_No(:c01), attr_);

                &AO.SALES_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');
            ELSE
                &AO.Client_SYS.Add_To_Attr('CATALOG_DESC', &AO.PART_CATALOG_API.Get_Description(Get_Part_No(:c01)), attr_);
                &AO.SALES_PART_API.Modify__(info_, objid_, objversion_, attr_, 'DO');
            END IF;

        CLOSE get_sales_part;
    END Create_Sales_Part;
`