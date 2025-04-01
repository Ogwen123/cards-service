import Joi from "joi"
import express from "express"
import { iso, validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { TokenData } from "../../global/types"
import { prisma } from "../../utils/db"
import { v4 as uuidv4 } from "uuid"

const SCHEMA = Joi.object({
    name: Joi.string().required(),
    topic: Joi.string().required(),
    visibility: Joi.allow("PUBLIC", "PRIVATE", "UNLISTED").required(),
    description: Joi.string().required(),
    cards: Joi.array().items(Joi.object({
        front: Joi.string().required().max(512),
        back: Joi.string().required().max(2048),
        note: Joi.string().max(512),
    })).required().min(1).max(256),
    tags: Joi.array().items(Joi.string().pattern(/^[a-z\d\-]*$/).required().min(3).max(32)).required().min(1).max(20).messages({
        "string.pattern.base": "{{#label}} must be lowercase and contain only letters, numbers, and dashes"
    }),
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

    // get a unique id - ik this is pretty pointless but want to be on the safe side
    let id = ""
    let unique = false
    while (!unique) {
        id = uuidv4()
        unique = (await prisma.decks.findMany({
            where: {
                id
            }
        })).length === 0
    }

    const cards = data.cards.map((cardData: any) => {
        let note;

        if (cardData.note) {
            note = {
                notes: {
                    create: {
                        user: validToken.id,
                        content: cardData.note,
                        updated_at: iso()
                    }
                }
            }
        } else {
            note = {}
        }

        return {
            id: uuidv4(),
            front: cardData.front,
            back: cardData.back,
            updated_at: iso(),
            notes: note
        }
    })

    const tags = data.tags.map((tag: any) => {
        return {
            id: uuidv4(),
            name: tag
        }
    })

    await prisma.decks.create({
        data: {
            id: id,
            creator: validToken.id,
            name: data.name,
            topic: data.topic,
            visibility: data.visibility,
            description: data.description,
            score: 0,
            cards: {
                create: cards
            },
            tags: {
                create: tags
            },
            created_at: iso(),
            updated_at: iso()
        },
        include: {
            cards: {
                include: {
                    notes: true,
                }
            },
            users: true,
            tags: true,
        }
    }).catch((e) => {
        console.log(e)
        error(res, 400, "An error occured while creating the task.")
    })

    success(res, null, "Successfully created task.", 201)
}