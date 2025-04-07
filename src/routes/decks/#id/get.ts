import express from "express"
import { error, success } from "../../../utils/api"
import { verifyToken } from "../../../utils/token"
import type { TokenData } from "../../../global/types"
import { prisma } from "../../../utils/db"
import { flagBFToPerms } from "../../../utils/flag"

export default async (req: express.Request, res: express.Response) => {
    // if they provide their token then validate it and add the deck to their history
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

    const deck = await prisma.decks.findUnique({
        where: {
            id: req.params.id
        },
        include: {
            cards: {
                include: {
                    notes: true
                }
            },
            users: true,
            tags: true

        }
    })

    if (deck === null) {
        error(res, 404, "Deck not found")
        return
    }

    if (!validToken || (deck?.creator !== validToken.id && deck?.visibility === "PRIVATE")) {
        error(res, 404, "Deck not found")
        return
    }

    const formattedDeck = {
        id: deck.id,
        name: deck.name,
        topic: deck.topic,
        visibility: deck.visibility,
        description: deck.description,
        score: deck.score,
        creator: deck.creator,
        created_at: deck.created_at,
        updated_at: deck.updated_at,
        cards: deck.cards,
        user: {
            id: deck.users.id,
            username: deck.users.username,
            perms: flagBFToPerms(deck.users.perm_flag!),
            created_at: deck.users.created_at
        },
        tags: deck.tags
    }

    success(res, formattedDeck, "Successfully fetched deck.")
}