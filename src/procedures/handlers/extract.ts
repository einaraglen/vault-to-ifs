import { get_root_part } from "@procedures/vault/get_root_part"
import { get_transaction_parts } from "@procedures/vault/get_transaction_parts"
import { filter_unique_parts, build_structure_chain } from "@utils/tools"
import { ConnectionPool } from "mssql"


export const extract_transaction = async (mssql: ConnectionPool, transaction: string) => {
    //const [root] = await get_latest_transactions(mssql, 1)
    const [root] = await get_root_part(mssql, transaction)

    const children = await get_transaction_parts(mssql, root.ItemNumber!, root.TransactionId!)

    const { map, list } = filter_unique_parts([...children, root])
    const struct_chain = build_structure_chain([...children, root], map)

    return { root, unique_parts: list, struct_chain }
}