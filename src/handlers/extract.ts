import { ConnectionPool } from "mssql"
import { get_latest_transactions } from "../procedures/vault/get_latest_transactions"
import { get_transaction_parts } from "../procedures/vault/get_transaction_parts"
import { build_structure_chain, filter_unique_parts } from "../utils"

export const extract_transaction = async (mssql: ConnectionPool) => {
    const [root] = await get_latest_transactions(mssql, 1)

    const children = await get_transaction_parts(mssql, root.ItemNumber!, root.TransactionId!)

    const unique_parts = filter_unique_parts([...children, root])
    const struct_chain = build_structure_chain(children)

    return { root, unique_parts, struct_chain }
}