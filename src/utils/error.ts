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
  constructor(message: string) {
    super(message);
    this.name = "CommitError";
  }
}

export class MSSQLError extends Error {
  public func: any = null;
  constructor(message: string, func: string) {
    super(message);
    this.name = "MSSQLError";
    this.func = func;
  }
}

export class TimeoutError extends Error {
  public time: number | null = null;
  constructor(message: string, time: number) {
    super(message);
    this.name = "TimeoutError";
    this.time = time;
  }
}

export class CheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckError";
  }
}

export class FileNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileNotFoundError";
  }
}