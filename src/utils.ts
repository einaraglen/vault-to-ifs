import { InMessage } from "./procedures/vault/convert_to_in_message";

export const get_bind_keys = (plsql: string) => {
    const regex = /:c\d{2}/g;
    const matches = plsql.match(regex);
    const unique = matches ? Array.from(new Set(matches)) : [];
    return unique.map((bind) => bind.replace(":", ""))
}

export const get_bindings = (message: InMessage, keys: string[]) => {
    let tmp: any = {}

    for (const key of keys) {
        tmp[key] = (message as Record<string, any>)[key]
    }

    return tmp;
}