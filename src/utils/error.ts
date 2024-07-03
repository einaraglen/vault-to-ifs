export class IFSError extends Error {
  public row: any = null;
  public func: any = null;
  constructor(message: string, func: string, row: any) {
    super(message);
    this.name = "IFSError";
    this.row = row;
    this.func = func;
  }
}

export class CommitError extends Error {
  public stage: string | null = null;
  constructor(message: string, stage: string) {
    super(message);
    this.name = "CommitError";
    this.stage = stage;
  }
}

export class MSSQLError extends Error {
    public func: any = null;
    constructor(message: string, func: string) {
        super(message);
        this.func = func;
    }
}

export class TimeoutError extends Error {
  public time: number | null = null;
    constructor(message: string, time: number) {
        super(message);
        this.time = time;
    }
}