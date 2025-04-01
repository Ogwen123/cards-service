export const permissions: { [key: number]: Perm } = {
    1: "ACTIVE",
    2: "ADMIN"
}

export type Perm = "ACTIVE" | "ADMIN"

export const flagBFToPerms = (bf: number) => {
    let perms: Perm[] = []

    for (let i of Object.keys(permissions)) {
        const j = parseInt(i)
        if ((j & bf) === j) {
            perms.push(permissions[j])
        }
    }

    return perms
}