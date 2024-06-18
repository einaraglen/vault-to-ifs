import { Connection } from "ifs-ap";

export const run = async () => {
  const IFS_APP = new Connection(process.env.IFS_BASE_URL, process.env.IFS_USERNAME, process.env.IFS_PASSWORD, "IFS9");

  IFS_APP.debug = true;

  IFS_APP.Sql(
    `select
        objid,
        PROJECT_ID,
        NAME,
        COMPANY,
        &AO.COMPANY_FINANCE_API.Get_Description(COMPANY),
        STATE,
        MANAGER,
        &AO.PERSON_INFO_API.Get_Name(MANAGER)
      from                                                                                                                                                                                                                                                                                                                                                                        from
        &AO.PROJECT
      where
        (PROJECT_ID = '180900')`
  )
    .then((result) => console.log(result))
    .catch((err) => console.log(err));
};

/**
 * 
 * try {
    const endpoint = new URL("fndext/clientgateway/ObjectConnectionServices/GetCountAttachments", process.env.IFS_BASE_URL);

    const auth = Buffer.from(`${process.env.IFS_USERNAME}:${process.env.IFS_PASSWORD}`).toString("base64");

    const res = await fetch(endpoint.href, {
      method: "POST",
      headers: {
        // Authorization: `Basic ${auth}`,
        'User-Agent': 'IFS .NET Access Provider/1.2',
        'Os-User': 'SEAONICS\\einar.aglen',
        'Program': 'Ifs.Fnd.Explorer.exe',
        'Machine': 'console@selt425.seaonics.com',
        'X-Ifs-Capabilities': '02',
        'Content-Type': 'application/octet-stream',
        'Accept-Encoding': 'gzip',
        'Host': 'ifs-app1.akeryards.as:58080',  // Ensure this matches your server host and port
        'Cookie': 'JSESSIONID=Cl0lsukqZ5R95yhJtAE4X319imxyQco_hteh1BrdFQRa_b-UW2G5!-2101279563',  // Set your session ID
      },
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("FETCH", { code: res.status, message: res.statusText, text });
      return;
    }

    const text = await res.text();

    console.log(text);
  } catch (err) {
    console.error("CATCH", err);
  }
};
 */
