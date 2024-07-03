export class IFSError extends Error {
    public args: any = null;
    constructor(message: string, args: any) {
        super(message)

        this.name = "IFSError"
        this.args = args;
    }
}