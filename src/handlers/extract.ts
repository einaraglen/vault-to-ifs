import { ConnectionPool } from "mssql"
import { get_latest_transactions } from "../procedures/vault/get_latest_transactions"
import { get_transaction_parts } from "../procedures/vault/get_transaction_parts"
import { build_structure_chain, convert_to_part, convert_to_struct, filter_unique_parts } from "../utils"
import { get_root_part } from "../procedures/vault/get_root_part"

export const extract_transaction = async (mssql: ConnectionPool, transaction: string) => {
    //const [root] = await get_latest_transactions(mssql, 1)
    const [root] = await get_root_part(mssql, transaction)

    const children = await get_transaction_parts(mssql, root.ItemNumber!, root.TransactionId!)

    const { map, list } = filter_unique_parts([...children, root])
    const struct_chain = build_structure_chain([...children, root], map)

    return { root: convert_to_part(root), unique_parts: list, struct_chain }
}