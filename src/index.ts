import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"

import { prisma } from "./utils/db"
import { error } from "./utils/api"

import meDecks from "./routes/users/@me/decks/get"
import userDecks from "./routes/users/#id/decks/get"
import postDeck from "./routes/decks/post"
import getDeck from "./routes/decks/#id/get"
import searchDecks from "./routes/decks/search/post"

//@ts-ignore
BigInt.prototype.toJSON = function () { return this.toString() }

dotenv.config()

const app = express()
const port = 3005
const CARDS_SERVICE_ID = "cb5d56fd-63a4-49cb-9582-6fea145ebd61"

//app.use(express.json())
app.use(bodyParser.json())

app.use('/*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,POST,PATCH,DELETE,OPTIONS")
    res.header("Access-Control-Max-Age", "86400")
    next();
});

app.use("/api/*", async (req, res, next) => {
    let enabled
    const enabledRes = (await prisma.services.findUnique({
        where: {
            id: CARDS_SERVICE_ID
        },
        select: {
            enabled: true
        }
    }))


    if (enabledRes === undefined || enabledRes === null) {
        enabled = true
    } else {
        enabled = enabledRes.enabled
    }

    //console.log(enabledRes)

    //console.log(enabled)
    if (enabled) {
        next();
    } else {
        error(res, 403, "This service is disabled.")
    }
})

app.get('/', async (req, res) => {
    const enabled = (await prisma.services.findUnique({
        where: {
            id: CARDS_SERVICE_ID
        },
        select: {
            enabled: true
        }
    }))?.enabled

    res.send({
        "message": (enabled ? "API is running." : "API is disabled.")
    })
})

app.get("/api/users/@me/decks", (req, res) => {
    meDecks(req, res)
})

app.get("/api/users/:id/decks", (req, res) => {
    userDecks(req, res)
})

app.post("/api/decks", (req, res) => {
    postDeck(req, res)
})

app.get("/api/decks/:id", (req, res) => {
    getDeck(req, res)
})

app.post("/api/decks/search", (req, res) => {
    searchDecks(req, res)
})

app.listen(port, () => {
    console.log(`cards service loaded, ${port}`)
})