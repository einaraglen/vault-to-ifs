declare namespace NodeJS {
  interface ProcessEnv {
    IFS_HOST: string;
    IFS_USERNAME: string;
    IFS_PASSWORD: string;
    IFS_OS_USER: string;
    IFS_VERSION: string;

    MSSQL_HOST: string;
    MSSQL_DOMAIN: string;
    MSSQL_USERNAME: string;
    MSSQL_PASSWORD: string;
    MSSQL_DATABASE: string;
  }

  interface IConnection {}
}
