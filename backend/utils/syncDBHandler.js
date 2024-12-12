const Room = require('../models/Room');
const redisClient = require('./redisClient');

/**
 * 캐시데이터와 몽고 디비의 데이터를 동기화 합니다.
 */
const syncCacheData = async () => {
    const cache = await redisClient.get("chatroom")
    const quries = []

    console.log("몽고디비와 캐시데이터 동기화를 시작합니다...")
    
    for(let i=0; i<cache.length; ++i) {
        const room = cache[i]
        quries.push({
            updateOne: {
                filter: { _id: room._id },
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
        console.debug(`몽고디비와 캐시데이터 동기화를 성공적으로 마쳤습니다.\n동기화 개수: ${res.modifiedCount} 개`)
    })
    .catch(async (e) =>{
        console.error(`몽고디비와 동기화 하는중 오류가 발생했습니다.\n오류: ${e}`)
    })
}

module.exports = {
    syncCacheData,
}