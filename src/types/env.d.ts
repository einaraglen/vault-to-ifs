declare namespace NodeJS {
    interface ProcessEnv {
        MSSQL_HOST: string
        MSSQL_USER: string
        MSSQL_PASSWORD: string
        MSSQL_DATABASE: string
        
        ORACLE_HOST: string
        ORACLE_USER: string
        ORACLE_PASSWORD: string
    }
  }