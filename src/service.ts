import { get_latest_transactions } from "./procedures/vault/get_latest_transactions";
import { get_transaction_parts } from "./procedures/vault/get_transaction_parts";
import { MSSQLConfig, MSSQLConnection } from "./providers/mssql/connection";
import { MSSQLRow } from "./providers/mssql/types";
import { filter_unique_parts } from "./utils";

type TreeNode = {
  part: MSSQLRow;
  children: TreeNode[];
}

type BOMTree = TreeNode[]

const insert_tree = (tree: BOMTree, parent?: TreeNode) => {
  for (const node of tree) {
    if (parent != null) {
      console.log(`${parent.part.ItemNumber} ${parent.part.Revision} -> ${node.part.ItemNumber} ${node.part.Quantity} ${node.part.Units}`)
    }
  }

  for (const node of tree) {
    if (node.children.length != 0) {
      insert_tree(node.children, node)
    }
  }
}

const build_tree = (parts: MSSQLRow[]) => {
  const partMap: Map<string, TreeNode> = new Map();

  parts.forEach(part => {
    partMap.set(part.ItemNumber!, { part: part, children: [] });
  });

  const roots: BOMTree = [];

  parts.forEach(part => {
    const currentTreeNode = partMap.get(part.ItemNumber!);
    if (part.ParentItemNumber) {
      const parentTreeNode = partMap.get(part.ParentItemNumber);
      if (parentTreeNode && currentTreeNode) {
        parentTreeNode.children.push(currentTreeNode);
      }
    } else {
      if (currentTreeNode) {
        roots.push(currentTreeNode);
      }
    }
  });

  return roots;
}

const mssql_config: MSSQLConfig = {
  domain: process.env.MSSQL_DOMAIN,
  user: process.env.MSSQL_USERNAME,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_HOST,
  database: process.env.MSSQL_DATABASE,
};

export const run = async () => {
  const mssql_connection = new MSSQLConnection(mssql_config);
  const mssql = await mssql_connection.instance();

  try {
    const [root] = await get_latest_transactions(mssql, 1)

    const children = await get_transaction_parts(mssql, root.ItemNumber!, root.TransactionId!)

    const test = filter_unique_parts(children)

  } catch (err) {
    console.error(err);
  } 
};
