-- 1. Step - prepare
&AO.ENG_PART_MASTER_API.NEW__(:p0,:p1,:p2,:p3,'PREPARE');
&AO.TECHNICAL_OBJECT_REFERENCE_API.NEW__(:p0,:p1,:p2,:p3,'PREPARE');

-- 2. Step - check if exists
&AO.PART_CATALOG_API.Check_Part_Exists2('PART_NO');
&AO.ENG_PART_MASTER_API.Check_Part_Exists('PART_NO');
&AO.PART_CATALOG_API.Get_Description('PART_NO');

-- 3. Step - get templates
SELECT 
    CONTRACT,PART_NO,DEFAULT_TEMPLATE_PART 
FROM 
    &AO.INVENTORY_TEMPLATE_PART_LOV.RESULT_RECORD_TYPE

-- 4. Step - check units
&AO.ISO_UNIT_API.Exist('PCS'); 
:p1 := &AO.ISO_UNIT_API.Get_Description('PCS');

-- 5. Step - make revision
&AO.ENG_PART_REVISION_API.NEW__(:p0,:p1,:p2,:p3,'PREPARE');

-- 6. Step - make engineering
PART_NO.166321321321
DESCRIPTION.Lamp , Lightning fixture, Explosion protected light fitting, ExLin NE+, 2400lm, 110-277 VAC, 22W, IP66/67, 2xM25, battery
FIRST_REVISION.A01
PROVIDE.Buy
AQUISITION_CODE.Demand
PLANNING_METHOD.PMRP Planned
DT_CRE.2024-10-09-10.53.00
USER_CREATED.EIA_TEST
SERIAL_TYPE.Not Serial Tracking
REV_NO_MAX.1
REV_NO_APP.0
UNIT_CODE.PCS
SERIAL_TRACKING_CODE.Not Serial Tracking
STD_NAME_ID
&AO.ENG_PART_MASTER_API.NEW__(:p0,:p1,:p2,:p3,'DO');

-- 7. Step - i dont even know anymore
p0 166321321321
p1 NOT LOT TRACKING
p2 null
p3 null
p4 null
p5 DEC
p6 PCS
p7 null
&AO.Eng_Part_Master_API.Update_Partca_Part_Master__(:p0,:p1,:p2,:p3,:p4,:p5,:p6,:p7);

p0 SE
p1 166321321321
p2 SE
p3 SE1PCS 
p4 A01
&AO.ENG_PART_INVENT_UTIL_API.Create_Inventory_Part(:p0,:p1,:p2,:p3,:p4);