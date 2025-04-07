export type VerifyResponse = {
    success: boolean,
    code: number,
    message: string,
    data: TokenData
}

export type TokenData = {
    id: string,
    perms: string[]
}

export type Visibility = "PUBLIC" | "PRIVATE" | "UNLISED"

export type Card = {
    id: string,
    front: string,
    back: string,
    deck_id: string,
    note?: string,
    updated_at: string
}

export type Tag = {
    id: string,
    name: string,
    deck: string
}

export type DeckUser = {
    id: string,
    username: string,
    perms: string[],
    updated_at: string
}

export type Deck = {
    id: string,
    name: string,
    topic: string,
    description: string,
    visibility: Visibility,
    score: number,
    updated_at: string,
    tags: Tag[],
    cards: Card[],
    user: DeckUser
}

