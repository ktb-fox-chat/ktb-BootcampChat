const mongoose = require('mongoose');
const RoomCacheHandler = require('../utils/roomhandler')
const Room = require('../models/Room');
const redisClient = require('../utils/redisClient');


module.exports = async (req, res) => {
    console.log("몽고디비와 캐시데이터 동기화를 시작합니다...")
    const quries = []
    const cache = await RoomCacheHandler.get()
    for(let i=0; i<cache.length; ++i) {
        const room = cache[i]
        quries.push({
            updateOne: {
                filter: { key: room.id },
                update: { $set: { 
                    value: {
                        name: room.name,
                        creator: room.creator,
                        hasPassword: room.hasPassword,
                        password: room.password,
                        createdAt: room.createdAt,
                        participants: room.participants,
                    }
                }},
                upsert: true,
            }
        })
    }

    await Room
    .bulkWrite(quries)
    .then(async (res) => {
        console.debug(`몽고디비와 캐시데이터 동기화를 성공적으로 마쳤습니다.\n${res}`)
        await redisClient.quit()
        await mongoose.disconnect()
        res.json({
            success: true,
            message: '서버를 안정적으로 종료하였습니다.'
        })
    })
    .catch(async (e) =>{
        console.error(`몽고디비와 동기화 하는중 오류가 발생했습니다.\n오류: ${e}`)
        await redisClient.quit()
        await mongoose.disconnect()
        res.json({
            success: false,
            message: '서버를 종료하는중 오류가 발생했습니다.'
        })
    })
}
