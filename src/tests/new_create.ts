import { Connection } from "../providers/ifs/internal/Connection";

const Get_Revision = `
    FUNCTION Get_Revision(current_revision_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefix VARCHAR2(1);
        num_part VARCHAR2(32767);
        new_num_part VARCHAR2(32767);
        num_value NUMBER;
        num_length PLS_INTEGER;
    BEGIN
        prefix := regexp_substr(current_revision_, '^[A-Z]');
        num_part := regexp_substr(current_revision_, '[0-9]+');

        IF num_part IS NOT NULL THEN
            num_length := LENGTH(num_part);
            num_value := to_number(num_part) + 1;

            IF LENGTH(to_char(num_value)) < num_length THEN
                new_num_part := lpad(to_char(num_value), num_length, '0');
            ELSE
                new_num_part := to_char(num_value);
            END IF;
        ELSE
            new_num_part := '01';
        END IF;

        RETURN prefix || new_num_part;
    END Get_Revision;
`

const Get_Part_No = `
    FUNCTION Get_Part_No(part_no_ IN VARCHAR2) RETURN VARCHAR2 IS
        prefixed_part_no_ VARCHAR2(100);
        prefix_           VARCHAR2(5) := 'SE';
    BEGIN
        IF ((part_no_ IS NULL) 
        OR (SUBSTR(part_no_, 1, LENGTH(prefix_)) = prefix_) 
        OR ((LENGTH(part_no_) = 7) 
        AND (SUBSTR(part_no_, 1, 1) != '2')) 
        OR (LENGTH(part_no_) != 7)) THEN
            prefixed_part_no_ := part_no_;
        ELSE
            prefixed_part_no_ := prefix_ || part_no_;
        END IF;
        RETURN (prefixed_part_no_);
    END Get_Part_No;
`

const Create_Master_Part = `
    PROCEDURE Create_Master_Part IS
        info_           VARCHAR2(2000);
        attr_           VARCHAR2(2000);
        objid_          VARCHAR2(2000);
        objversion_     VARCHAR2(2000);
    BEGIN
        &AO.ENG_PART_MASTER_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');

        &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No(:part_no), attr_);
        &AO.Client_SYS.Add_To_Attr('DESCRIPTION', :description, attr_);
        &AO.Client_SYS.Add_To_Attr('FIRST_REVISION', :rev, attr_);
        &AO.Client_SYS.Add_To_Attr('UNIT_CODE', :unit, attr_);

        &AO.Client_SYS.Add_To_Attr('PROVIDE', 'Buy', attr_);
        &AO.Client_SYS.Add_To_Attr('AQUISITION_CODE', 'Demand', attr_);
        &AO.Client_SYS.Add_To_Attr('PLANNING_METHOD', 'PMRP Planned', attr_);
        &AO.Client_SYS.Add_To_Attr('SERIAL_TYPE', 'Not Serial Tracking', attr_);
        &AO.Client_SYS.Add_To_Attr('REV_NO_MAX', '1', attr_);
        &AO.Client_SYS.Add_To_Attr('REV_NO_APP', '0', attr_);
        &AO.Client_SYS.Add_To_Attr('SERIAL_TRACKING_CODE', 'Not Serial Tracking', attr_);

        &AO.ENG_PART_MASTER_API.NEW__(info_, objid_, objversion_, attr_, 'DO');
    END Create_Master_Part;
`

const Create_Sales_Part = `
    PROCEDURE Create_Sales_Part IS
        info_           VARCHAR2(2000);
        attr_           VARCHAR2(2000);
        objid_          VARCHAR2(2000);
        objversion_     VARCHAR2(2000);
    BEGIN
        &AO.SALES_PART_API.New__(info_, objid_, objversion_, attr_, 'PREPARE');

        &AO.Client_SYS.Add_To_Attr('CATALOG_GROUP', 'SE', attr_);
        &AO.Client_SYS.Add_To_Attr('SALES_PRICE_GROUP_ID', 'SE', attr_);
        &AO.Client_SYS.Add_To_Attr('COMPANY', 'SE', attr_);

        &AO.Client_SYS.Add_To_Attr('LIST_PRICE', 0, attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_TYPE_DB', 'INV', attr_);
        &AO.Client_SYS.Add_To_Attr('SOURCING_OPTION_DB', 'INVENTORYORDER', attr_);

        &AO.Client_SYS.Add_To_Attr('CATALOG_DESC', &AO.PART_CATALOG_API.Get_Description(Get_Part_No(:part_no)), attr_);
        &AO.Client_SYS.Add_To_Attr('SALES_UNIT_MEAS', &AO.PART_CATALOG_API.Get_Unit_Code(Get_Part_No(:part_no)), attr_);

        &AO.Client_SYS.Add_To_Attr('PART_NO', Get_Part_No(:part_no), attr_);
        &AO.Client_SYS.Add_To_Attr('CATALOG_NO', Get_Part_No(:part_no), attr_);
        &AO.Client_SYS.Add_To_Attr('PURCHASE_PART_NO', Get_Part_No(:part_no), attr_);

        &AO.SALES_PART_API.New__(info_, objid_, objversion_, attr_, 'DO');
    END Create_Sales_Part;
`

const Create_Inventory_Part = `
    PROCEDURE Create_Inventory_Part IS
        site_       VARCHAR2(50) := 'SE';
        template_   VARCHAR2(50) := 'SE1PCS';
        rev_        VARCHAR2(50);
    BEGIN
        rev_:= &AO.Eng_Part_Revision_API.Get_Last_Rev(Get_Part_No(:part_no));
        &AO.ENG_PART_INVENT_UTIL_API.Create_Inventory_Part(site_, Get_Part_No(:part_no), site_, template_, rev_);
    END Create_Inventory_Part;
`

const plsql = `
    DECLARE
        ${Get_Revision}
        ${Get_Part_No}
        ${Create_Master_Part}
        ${Create_Inventory_Part}
        ${Create_Sales_Part}
    BEGIN
        Create_Master_Part();
        Create_Inventory_Part();
        Create_Sales_Part();
        :temp := 'done';
    END;
`;

type Arguments = {
    part_no: string,
    description: string,
    rev: string
    unit: string,
}

export const create_part = async (client: Connection, args: Arguments) => {
    const res = await client.PlSql(plsql, { ...args, temp: "" });

    if (!res.ok) {
        throw Error(res.errorText);
    }

    console.log(res.bindings)
};