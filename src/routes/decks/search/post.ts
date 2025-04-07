import Joi from "joi"
import express from "express"
import { iso, validate } from "../../../utils/utils"
import { error, success } from "../../../utils/api"
import { verifyToken } from "../../../utils/token"
import type { Deck, TokenData } from "../../../global/types"
import { prisma } from "../../../utils/db"
import { v4 as uuidv4 } from "uuid"
import { flagBFToPerms } from "../../../utils/flag"

const SCHEMA = Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    topic: Joi.string()
}).min(1)

export default async (req: express.Request, res: express.Response) => {
    // validate the request body
    const valid = validate(SCHEMA, req.body || {})

    if (valid.error) {
        error(res, 400, valid.data)
        return
    }

    const data = valid.data

    let validToken: TokenData | null = null

    if (req.get("Authorization")) {
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

        validToken = tokenRes.data
    }

    let results: any[] = []

    if (data.name) {
        const name_results = await prisma.decks.findMany({
            where: {
                name: {
                    contains: data.name
                },
                visibility: "PUBLIC"
            },
            include: {
                users: true
            },
            orderBy: {
                score: "desc"
            }
        })
        results = [...results, ...name_results]
    }
    if (data.topic) {
        const topic_results = await prisma.decks.findMany({
            where: {
                topic: {
                    contains: data.topic
                },
                visibility: "PUBLIC"
            },
            include: {
                users: true
            },
            orderBy: {
                score: "desc"
            }
        })
        results = [...results, ...topic_results]
    }
    if (data.description) {
        const description_results = await prisma.decks.findMany({
            where: {
                description: {
                    contains: data.topic
                },
                visibility: "PUBLIC"
            },
            include: {
                users: true
            },
            orderBy: {
                score: "desc"
            }
        })
        results = [...results, ...description_results]
    }
    if (data.name) {
        const tag_results = await prisma.decks.findMany({
            where: {
                tags: {
                    some: {
                        name: {
                            in: data.tags
                        }
                    }
                },
                visibility: "PUBLIC"
            },
            include: {
                users: true
            },
            orderBy: {
                score: "desc"
            }
        })
        results = [...results, ...tag_results]
    }

    // de-duplicate results
    let results_set: { [key: string]: any } = {}

    for (let deck of results) {
        if (results_set[deck.id]) {
            continue
        } else {

            const formattedDeck = {
                id: deck.id,
                name: deck.name,
                topic: deck.topic,
                visibility: deck.visibility,
                description: deck.description,
                score: deck.score,
                created_at: deck.created_at,
                updated_at: deck.updated_at,
            }

            results_set[deck.id] = formattedDeck
        }
    }

    success(res, Object.values(results_set), "Successfully fetched decks.", 200)
}