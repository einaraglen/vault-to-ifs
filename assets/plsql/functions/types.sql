TYPE PART_REC IS RECORD (
    objid          VARCHAR2(2000),
    objversion     VARCHAR2(2000),
    found          BOOLEAN
);

TYPE REV_REC IS RECORD (
    last_rev        VARCHAR2(10),
    new_rev         VARCHAR2(10),
    created         BOOLEAN
);