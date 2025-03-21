import Joi from "joi"
import express from "express"
import { validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { TokenData } from "../../global/types"
import { prisma } from "../../utils/db"

const SCHEMA = Joi.object({
    id: Joi.string().required()
})

export default async (req: express.Request, res: express.Response) => {


    success(res)
}