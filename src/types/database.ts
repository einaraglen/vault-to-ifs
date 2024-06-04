export type Callback = (connection: { query: (sql: string) => Promise<any>}) => Promise<void>

export type Database = {
    query: (sql: string) => Promise<any>
    transaction: (callback: Callback) => Promise<void>
    close: () => Promise<void>
}