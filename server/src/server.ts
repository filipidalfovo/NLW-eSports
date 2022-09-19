import express from 'express'
import cors from 'cors' // limita qual frontend ira consumir backend

import { PrismaClient } from '@prisma/client'
import { convertHourToMinutes } from './utils/convertHourToMinutes'
import { convertMinutesToHour } from './utils/convertMinutesToHour'

const app = express()
app.use(express.json())
app.use(cors())

const prisma = new PrismaClient()

// localhost:3333/ads
// HTTP methods / API RESTful / HTTP Codes (200, 300, etc...)

app.get('/games', async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true
                }
            }
        }
    })

    return response.json(games)
})

app.post('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;
    const body = request.body;

    const ad = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertHourToMinutes(body.hourStart),
            hourEnd: convertHourToMinutes(body.hourEnd),
            useVocieChannel: body.useVocieChannel
        }
    })

    return response.status(210).json(ad)
})

// o express identifica como paramtro o que esta depois do ':'
app.get('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVocieChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true            
        },
        where: {
            gameId: gameId
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHour(ad.hourStart),
            hourEnd: convertMinutesToHour(ad.hourEnd)
        }
    }))
})

app.get('/ads/:id/discord', async (request, response) => {    
    const adId = request.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id: adId
        }
    })

    return response.json({
        discord: ad.discord
    })
})

app.listen(3333)