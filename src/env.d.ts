declare namespace NodeJS {
  interface ProcessEnv {
    IFS_HOST: string;
    IFS_USERNAME: string;
    IFS_PASSWORD: string;
    IFS_OS_USER: string;
    IFS_VERSION: string;

    SMTP_HOST: string
    SMTP_USER: string
    SMTP_PASSWORD: string
    
    VAULT_EXCHANGE_PATH: string
    VAULT_COMPLETE_PATH: string
    XML_TRANSFORM_PATH: string
  }

  interface IConnection {}
}
