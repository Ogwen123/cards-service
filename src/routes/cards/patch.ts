import Joi from "joi"
import express from "express"
import { iso, validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { TokenData } from "../../global/types"
import { prisma } from "../../utils/db"
import { v4 as uuidv4 } from "uuid"

const SCHEMA = Joi.object({
    front: Joi.string().required().max(512),
    back: Joi.string().required().max(2048),
    note: Joi.string().max(2048)
})

export default async (req: express.Request, res: express.Response) => {
    // validate the request body
    const valid = validate(SCHEMA, req.body || {})

    if (valid.error) {
        error(res, 400, valid.data)
        return
    }

    const data = valid.data

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

    const update = await prisma.cards.update({
        where: {
            decks: {
                creator: validToken.id
            },
            id: req.params.id
        },
        data: {
            front: data.front,
            back: data.back,
            ...(data.note && {
                notes: {
                    upsert: {
                        where: {
                            user_card: {
                                user: validToken.id,
                                card: req.params.id
                            }
                        },
                        update: {
                            content: data.note,
                            updated_at: iso()
                        },
                        create: {
                            user: validToken.id,
                            content: data.note,
                            updated_at: iso()
                        }
                    }
                }
            }),
            updated_at: iso()
        },
        include: {
            notes: true
        }
    })

    success(res, update, "Successfully updated note.", 201)
}