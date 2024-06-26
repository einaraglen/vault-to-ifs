`
-- Get Max 100 Master Parts
select TOP 100
       bom.ItemNumber "ItemNumber",
	   bom.Revision "Revision",
	   bom.ChildCount "ChildCount",
	   bom.TransactionId "TransactionId"
from erp.dbo.bom bom
where bom.Status = 'Posted'
AND bom.ParentItemNumber is null
AND bom.ParentItemRevision is null
AND bom.ItemNumber != ''
order by bom.LastUpdate asc

-- Get Items for Master Part
select bom.rowID "bomRowId",
	bom.TransactionId "bomTransactionId",
	   bom.Pos "bomLine",
	   bom.Quantity "bomQuantity",
	   bom.LastUpdate "bomLastUpdate",
	   bom.ParentItemNumber "bomParentPart",
	   isnull(bom.NewParentItemRevision, bom.ParentItemRevision) "bomParentRevision",
	   bom.ItemNumber "bomItemNumber",
	   isnull(bom.NewRevision, bom.Revision) "bomItemRevision",
	   bom.SparePart "bomItemSparePart",
	   ISNULL(bom.LifecycleState, bom.[State(Historical)]) "bomItemStatus"
from erp.dbo.bom bom
where bom.Status = 'Accepted'
and bom.ParentItemNumber = ${item_number}
and bom.ParentItemRevision = ${item_rev}
and bom.TransactionId =  ${transaction_id}


-- Get Items Details for Part Master
select distinct bom.ItemNumber "itemNumber",
   bom.Revision "itemRevision",
   bom.Category "itemCategory",
   bom.Title "itemTitle",
   bom.Description "itemDescription",
   bom.Units "itemUnits",
   bom.LifecycleState "itemLifecycleState",
   bom.Category_1 "itemCategory1",
   bom.Category_2 "itemCategory2",
   bom.Category_3 "itemCategory3",
   bom.Category_4 "itemCategory4",
   bom.InternalDescription "itemInternalDescription",
   bom.Mass_g "itemMassG",
   bom.Material "itemMaterial",
   bom.MaterialCertifikate "itemMaterialCertificate",
   bom.Project "itemProject",
   bom.SerialNo "itemSerialNo",
   bom.SparePart "itemSparePart",
   bom.Vendor "itemVendor",
   bom.CriticalItem "itemCriticalItem",
   bom.LongLeadItem "itemLongLeadItem",
   bom.SupplierPartNo "itemSupplierPartNo",
   CONVERT(date,bom.LastUpdate)  "itemLastUpdate",
   bom.LastUpdatedBy "itemLastUpdatedBy",
   ISNULL(bom.LifecycleState, bom.[State(Historical)]) "itemStatus",
   bom.[State(Historical)] "itemStateHistorical",
   bom.TransactionId "itemTransactionId",
   bom.ReleasedBy "itemCreatedBy",
   bom.ReleaseDate "itemCreatedDate"
from erp.dbo.bom bom
where bom.Status = 'Posted'
and bom.TransactionId = ${transaction_id}
AND bom.ItemNumber != ''
`