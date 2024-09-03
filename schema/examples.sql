/*
    Table Schema for VAULT_EXPORT
*/
CREATE TABLE [dbo].[vault_exchange]
(
	[RowID] [uniqueidentifier] ROWGUIDCOL NOT NULL DEFAULT (NEWID()),
    [TransactionID] [nvarchar](100) NOT NULL,

    [Status] [nvarchar](20) NOT NULL DEFAULT (N'Posted'),
    [State] [nvarchar](50) NOT NULL,

    -- Part Information
    [PartNumber] [nvarchar](25) NOT NULL,
    [PartRevision] [nvarchar](6) NOT NULL,
    [PartRevisionNew] [nvarchar](6) NULL, -- New Revision from ERP
    [Title] [nvarchar](200) NOT NULL,
    [Description] [nvarchar](200) NULL,
	[Units] [nvarchar](10) NOT NULL DEFAULT (N'Pcs'),
    [Category] [nvarchar](100) NULL,

    [Mass] [nvarchar](100) NULL,
	[Material] [nvarchar](100) NULL,
	[MaterialCertificate] [nvarchar](70) NULL,
    [SerialNumber] [nvarchar](100) NULL DEFAULT (N'N'),
    [ChildCount] [nvarchar](6) NULL,

    -- Supplier Information
    [Supplier] [nvarchar](100) NULL,
	[SupplierPartNumber] [nvarchar](100) NULL,
	[SupplierPartDescription] [nvarchar](200) NULL,

    -- Flags True | False 
    [IsSpare] [nvarchar](10) NULL DEFAULT (N'False'),
    [IsCritical] [nvarchar](10) NULL DEFAULT (N'False'),
	[IsLongLead] [nvarchar](10) NULL DEFAULT (N'False'),

    -- Assembly Information
    [Quantity] [nvarchar](20) NULL,
    [Position] [nvarchar](20) NULL,
    [ParentPartNumber] [nvarchar](25) NULL,
	[ParentRevision] [nvarchar](6) NULL,
	[ParentRevisionNew] [nvarchar](6) NULL, -- New Revision from ERP

    -- General Transaction Information
    [Author] NVARCHAR(100) NOT NULL,
    [Released] DATETIME NOT NULL DEFAULT (GETDATE()),
    [Updated] DATETIME NOT NULL DEFAULT (GETDATE())
);

/*
    Example of Single-Line Export Insert Statement
*/
INSERT INTO [ERP].[dbo].[VAULT_EXPORT]
( 
    [TransactionID], 
    [State], 
    [PartNumber], 
    [PartRevision], 
    [Title], 
    [Description], 
    [Units], 
    [Category], 
    [Mass], 
    [Material], 
    [Supplier], 
    [SupplierPartNumber], 
    [SupplierPartDescription], 
    [IsSpare], 
    [IsCritical], 
    [IsLongLead], 
    [Author]
)
VALUES 
(
    NEWID(), 
    'Released', 
    '16106025', 
    'A', 
    'Hydraulic motor', 
    'Hydraulic Motor with valveblock interface', 
    'Each', 
    'Engineering', 
    '1020000', 
    'Generic', 
    'Imenco bauer', 
    '503854-HMH9-16,3-1-P-5-Y-N', 
    'Radial piston motor', 
    'False', 
    'True', 
    'False', 
    'einar.aglen@seaonics.com'
);

/*
    Example of Multi-Line Top-Level Export Insert Statement
*/
INSERT INTO [ERP].[dbo].[VAULT_EXPORT]
(
    [TransactionID], 
    [State], 
    [PartNumber], 
    [PartRevision], 
    [Title], 
    [Description], 
    [Units], 
    [Category], 
    [Mass], 
    [ChildCount], 
    [IsSpare], 
    [IsCritical], 
    [IsLongLead], 
    [Author]
)
VALUES 
(
    '092ae048-c7f2-43f9-a82d-6b5827daf7a7', 
    'Released', 
    '2129924', 
    'B', 
    'UHD Umbilical Winch (W32S)', 
    'UHD Umbilical Winch (W32S) - Trawler', 
    'Each', 
    'Dimentional Sketch', 
    '39000000', 
    '1', 
    'False', 
    'False', 
    'False', 
    'einar.aglen@seaonics.com'
);

/*
    Example of Multi-Line Sub-Level Export Insert Statement
*/
INSERT INTO [ERP].[dbo].[VAULT_EXPORT]
(
    [TransactionID], 
    [State], 
    [PartNumber], 
    [PartRevision], 
    [Title], 
    [Description], 
    [Units], 
    [Category], 
    [Mass], 
    [ChildCount], 
    [IsSpare], 
    [IsCritical], 
    [IsLongLead], 
    [Quantity], 
    [Position], 
    [ParentPartNumber], 
    [ParentRevision], 
    [Author]
)
VALUES 
(
    '092ae048-c7f2-43f9-a82d-6b5827daf7a7', 
    'Released', 
    '2141911', 
    'A', 
    'UHD Umbilical Winch', 
    'UHD Umbilical Winch - Trawl', 
    'Each', 
    'Engineering', 
    '39710671.01824055', 
    '31', 
    'False', 
    'False', 
    'False', 
    '5', 
    '1', 
    '2129924', 
    'B', 
    'einar.aglen@seaonics.com'
);

