import express from "express"
import { error, success } from "../../../../utils/api"
import { verifyToken } from "../../../../utils/token"
import type { TokenData } from "../../../../global/types"
import { prisma } from "../../../../utils/db"

export default async (req: express.Request, res: express.Response) => {
    // don't need to be logged in to see a users decks

    const decks = await prisma.decks.findMany({
        where: {
            creator: req.params.id,
            visibility: "PUBLIC"
        }
    })

    const formattedDecks = decks.map((deck) => {
        return {
            id: deck.id,
            name: deck.name,
            topic: deck.topic,
            description: deck.description,
            visibility: deck.visibility,
            score: deck.score,
            updated_at: deck.updated_at,
            created_at: deck.created_at
        }

    })

    success(res, formattedDecks, "Successfully fetched user decks.")
}