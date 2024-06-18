const endpoint = "/fndext/clientgateway/AccessPlsql/Invoke?frmProjectInfoNew"

const client = async () => {
    const headers = [
        ["Content-Type", "application/octet-stream"],
        ["Request-Header-Length", headerBytes.toString()],
        ["Authorization", this._connection.loginCredentials],
        ["Client-Session-Id", this._clientSessionId || this._connection.clientSessionId],
        ["Os-User", ""], // SEAONICS\einar.aglen
    ];

    const messageOptions = {
        method: 'POST',
        headers: headers,
        // body: body
    };
    const response = await fetch(new URL(endpoint, process.env.IFS_BASE_URL), messageOptions)

    if (!response.ok || response.status != 200 ||
        !response.headers.has("Content-Type") || response.headers.get("Content-Type") != "application/octet-stream") {
        const errorText = await response.text();
        return this.ErrorResponse(errorText);
    }

    const buffer = await response.arrayBuffer();
    
    let ifsData = MasrshalObject.Unmarshall(new Uint8Array(buffer), transfrmFunc);
    if (Array.isArray(ifsData) && ifsData.length > 0 && !Array.isArray(ifsData[0])) {
        ifsData = [ifsData, undefined];// response with error don't have body part
    }
    if (!(Array.isArray(ifsData) && ifsData.length >= 2 && Array.isArray(ifsData[0]))) {
        return this.ErrorResponse("Wrong type of response.");
    }
}