import Joi from "joi"
import express from "express"
import { validate } from "../../../utils/utils"
import { error, success } from "../../../utils/api"
import { verifyToken } from "../../../utils/token"
import type { TokenData } from "../../../global/types"
import { prisma } from "../../../utils/db"

export default async (req: express.Request, res: express.Response) => {
    // validate token
    const token = req.get("Authorization")?.split(" ")[1]

    if (token === undefined) {
        error(res, 401, "Invalid token")
        return
    }

    const tokenRes = await verifyToken(token)

    if (tokenRes === false) {
        error(res, 401, "This is not a valid token.")
        return
    }

    const validToken: TokenData = tokenRes.data

    const userData = await prisma.users.findUnique({
        where: {
            id: validToken.id
        }
    })

    if (userData === null) {
        error(res, 404, `User data not found for ${validToken.id}`)
        return
    }
    success(res, {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        perm_flag: userData.perm_flag,
        created_at: userData.created_at
    },
        "Successfully fetched user data."
    )
}