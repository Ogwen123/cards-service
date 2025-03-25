import express from "express"
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

    const decks = await prisma.decks.findMany({
        where: {
            creator: validToken.id
        }
    })

    success(res, decks, "Successfully fetched user decks.")
}