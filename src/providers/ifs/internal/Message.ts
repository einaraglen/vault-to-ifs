import { NewId, ToIfsString } from "../utils";
import { BindingsArray, Bindings, BindingParameterType, BindingValueType } from "./Bindings"
import { MasrshalObject, IfsDataType, IfsDataObjectType, transfromFuncType } from "../buffer/MarshalObject"
import { BinaryWriter } from "../buffer/BinaryWriter"
import { UTF8Length } from "../buffer/utf8";
import { ConnectionInterface } from "./ConnectionInterface"
import { SqlOneResponse } from './PlSqlCommandTypes';
import { _PlSqlCommand } from './PlSqlCommand';

export interface Message {
    get connection(): ConnectionInterface;
    get multipleQuery(): boolean;

    AddBinding(bindings: (BindingParameterType | string), name?: string, value?: BindingValueType, type?: string) : void;
}


export abstract class _Message implements Message {
    protected _connection: ConnectionInterface;
    protected _bindings?: BindingsArray;
    protected _interface: string = "";
    protected _operation: string = "";
    protected _clientSessionId: string = "";
    protected _transactionId: string = "";

    constructor (connection: ConnectionInterface) {
        this._connection = connection;
    }

    public get bindings() : Array<Bindings> {
        return this._bindings?.bindingsArray || [];
    }

    get multipleQuery(): boolean {
        return this._bindings?.multipleQuery || false;
    }

    public get connection() : ConnectionInterface {
        return this._connection;
    }

    public OpenTempSession() {
        this._clientSessionId = NewId();
    }

    public abstract CloseTempSession(): Promise<SqlOneResponse>;


    public AddBinding(bindings: BindingParameterType ) {
        if (!this._bindings)
            this._bindings = new BindingsArray();
        this._bindings.AddBinding(bindings);
    }

    public SizeOfRequestHeader(): number {
        return 92
            + this.connection.clientId.length
            + this.connection.locale.length
            + (this.connection.runAs ? this.connection.runAs.length + 8 : 0)
            + (this.connection.debug ? 121 : 0);
    }

    protected CreateRequestHeader(): IfsDataType {
        return [{
            "name": "FND_CONTEXT",
            "buffer": true,
            "value": [
                {
                    "value": this.connection.clientId,
                    "name": "CLIENT_ID"
                },
                {
                    "value": NewId(),
                    "name": "REQUEST_ID"
                },
                {
                    "value": this.connection.locale,
                    "name": "LOCALE"
                },
                {
                    "value": "FALSE",
                    "name": "ENCODE_BINARY_VALUE"
                },
                ... (this.connection.debug ? [
                    {
                            "name": "DEBUG",
                            "buffer": true,
                            "value": [
                                {
                                    "name": "CALL_SEQUENCE",
                                    "value": "DEBUG"
                                },
                                {
                                    "name": "DB_ACCESS",
                                    "value": "DEBUG"
                                },
                                {
                                    "name": "SKELETON_ARGUMENTS",
                                    "value": "DEBUG"
                                },
                                {
                                    "name": "STUB_ARGUMENTS",
                                    "value": "DEBUG"
                                },
                                {
                                    "name": "APPLICATION_CODE",
                                    "value": "DEBUG"
                                },
                                {
                                    "name": "OUTPUT",
                                    "value": ""
                                }
                            ]
                        }
                ] : []),
                ... (this.connection.runAs ? [
                    {
                        "value": this.connection.runAs,
                        "name": "RUN_AS"
                    }
                ] : [])
            ],
        }];
    }

    protected RequestMessage(): [number, Uint8Array] {
        if (!this._interface || !this._operation)
            throw Error("Empty interface or operation.");
        const messageSize = this.SizeOfRequestHeader() + this.SizeOfRequestBody();
        const writer = new BinaryWriter(messageSize + 16 );
        MasrshalObject._Marshall(writer, this.CreateRequestHeader());
        const headerBytes = writer.offset;

        MasrshalObject._Marshall(writer, this.CreateRequestBody());
        console.assert(writer.offset <= messageSize);

        return [headerBytes, writer.ToUint8Array()];
    }

    public async SendMessage(headerBytes : number, body : Uint8Array): Promise<Response> {

        const headers = [
            ["Content-Type", "application/octet-stream"],
            ["Request-Header-Length", headerBytes.toString()],
            ["Authorization", this._connection.loginCredentials],
            ["Client-Session-Id", this._clientSessionId || this._connection.clientSessionId],
            ["Os-User", this._connection.osUser],
        ];
        if (this._connection.timeout)
            headers.push(["X-Ifs-Timeout", this._connection.timeout.toString()]);

        const messageOptions = {
            method: 'POST',
            headers: headers,
            body: body,
        };

        return await fetch(this._connection.GetFullConnectionString(this._interface, this._operation), messageOptions as any) as any
    } 

    protected SizeOfRequestBidings( index : number ): number {
        if (index >= 0 && this._bindings) {
            let sizeOf = 0;
            const thisBindings = this.bindings[index];
            thisBindings.bindings.forEach(bind => {
                sizeOf +=
                      1  //type
                    + 1 + bind.direction.length
                    + 1 + bind.name.length
                    + 1; // value=1+...
                if (typeof bind.value === "string") {
                    const valueLength = UTF8Length(bind.value);
                    sizeOf += 3 + (valueLength < 64 ? 1 : 2) + valueLength;
                } else if (typeof bind.value === "number") {
                    sizeOf += 1 + bind.value.toString().length;
                } else if (bind.value instanceof Date) {
                    sizeOf += 2 + 19;
                } else if (bind.value instanceof Uint8Array) {
                    sizeOf += 5 + 5 + bind.value.byteLength;
                }
            })
            return sizeOf;
        }
        return 0;
    }

    protected GetRequestBidings( index : number ): IfsDataType {
        const bindings: IfsDataType = [];
        if (index >= 0 && this._bindings) {
            const thisBindings = this.bindings[index];
            thisBindings.bindings.forEach(bind => {
                bindings.push(
                    {
                        "value": ToIfsString(bind.value),
                        "name": bind.name,
                        "type": bind.type,
                        "status": bind.direction,
                        ...((!bind.value && ['LPA', 'LPT'].includes(bind.type)) ?
                            { "isNull": true }
                            : {}
                        ),
                        ...(bind.type === "R.B64" ? { binary: true } : {})
                    });
            })
        }
        return bindings;
    }

    protected abstract SizeOfRequestBody(): number;
    protected abstract CreateRequestBody(): IfsDataType;


    protected GetErrorMessage(ifsData: IfsDataType): string {
        const statusInfo = MasrshalObject.ExtractSubobject(ifsData, [0, { name: "STATUS" }]) as IfsDataObjectType;
        if (!statusInfo) {
            return "Wrong returned data structure. I can't find a record with status information.";
        }else if (statusInfo.value === "ERROR") {
            const errorInfo = MasrshalObject.ExtractSubobject(ifsData, [0, { name: "ERROR" }]) as IfsDataObjectType;
            if (errorInfo) {
                const message = MasrshalObject.ExtractSubobject(errorInfo, [{ name: "MESSAGE" }]) as IfsDataObjectType;
                return message?.value || "Wrong returned data structure";
            } else {                
                return "Wrong returned data structure. Status is ERROR but I can't find an error message.";
            }
        } else if (statusInfo.value != "DONE") {            
            return "Something wrong in returned data. Status = " + statusInfo.value;
        }
        return "";
    }

    protected abstract ErrorResponse(errorText: string): object;
    protected abstract MapResponse(ifsData: IfsDataType): object;

    protected async _ExecuteMessage( transfrmFunc? : transfromFuncType): Promise<IfsDataType> {
        const [headerBytes, body] = this.RequestMessage();
        const response = await this.SendMessage(headerBytes, body);

        if (!response.ok || response.status != 200 ||
            !response.headers.has("Content-Type") || response.headers.get("Content-Type") != "application/octet-stream") {
            const errorText = await response.text();
            return this.ErrorResponse(errorText);
        }

        const buffer = await response.arrayBuffer();
        //fs.writeFileSync("Response.dat", new Uint8Array( buffer));
        
        let ifsData = MasrshalObject.Unmarshall(new Uint8Array(buffer), transfrmFunc);

        if (Array.isArray(ifsData) && ifsData.length > 0 && !Array.isArray(ifsData[0])) {
            ifsData = [ifsData, undefined];// response with error don't have body part
        }
        //console.log(JSON.stringify(ifsData, null, 4));
        if (!(Array.isArray(ifsData) && ifsData.length >= 2 && Array.isArray(ifsData[0]))) {
            return this.ErrorResponse("Wrong type of response.");
        }

        const errorMessage = this.GetErrorMessage(ifsData);
        if (errorMessage)
            return this.ErrorResponse(errorMessage);
        else
            return this.MapResponse(ifsData);
    }

}