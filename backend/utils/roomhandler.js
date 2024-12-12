const { ObjectId } = require('mongodb');
const redisClient = require('./redisClient');
const { syncCacheData } = require('./syncDBHandler')

let baseCacheLimit = 2

/**
 * 레디스에 적재된 채팅방 데이터를 파싱후 모두 조회합니다.
 */
const get = async () => {
    let cache = await redisClient.get(`chatroom`)

    if(cache) return cache.map((item) => ({
        _id: new ObjectId(item._id),
        creator: item.creator,
        participants: item.participants,
        name: item.name,
        password: item.password,
        hasPassword: item.hasPassword,
        createdAt: new Date(item.createdAt),
        loadfactor: item.loadfactor ?? 0.65,
    }))
    return null
}

const findById = async (id) => {
    let cache = await redisClient.get(`chatroom`)

    if(cache) {
        const room = cache.find((item) => item._id === id)
        return room 
        ? {
            _id: new ObjectId(room._id),
            creator: room.creator,
            participants: room.participants,
            name: room.name,
            password: room.password,
            hasPassword: room.hasPassword,
            createdAt: new Date(room.createdAt),
            loadfactor: room.loadfactor ?? 0.65,
        } 
        : null
    }
    return null
}

/**
 * 새로 생성된 혹은 적재되지 않은 채팅방을 캐시 데이터에 삽입합니다.</br>
 * 
 * 이미 존재하는 데이터일 경우, 무시합니다.
 */
const add = async (room) => {
    let cache = await redisClient.get(`chatroom`)
    if(!cache) cache = []
    if(cache.find((item) => item._id === room._id) !== undefined) {
        return
    }

    room = {
        _id: room._id,
        creator: room.creator,
        participants: room.participants,
        name: room.name,
        password: room.password,
        hasPassword: room.hasPassword,
        createdAt: room.createdAt,
        loadfactor: room.loadfactor ?? 0.65,
    }

    cache.push(room)
    const capacity = cache.length
    if(capacity / baseCacheLimit >= 0.65) {
        syncCacheData()
        baseCacheLimit *= 2
    }

    await redisClient.set('chatroom', cache)
}

/**
 * 새로 생성된 혹은 적재되지 않은 채팅방을 캐시 데이터에 삽입합니다.</br>
 * 
 * 이미 존재하는 데이터일 경우, 제거 후 새로운 데이터를 추가합니다.
 */
const upsert = async (room) => {
    let cache = await redisClient.get(`chatroom`)
    if(!cache) cache = []
    cache = cache.filter((item) => item._id !== room._id)

    room = {
        _id: room._id,
        creator: room.creator,
        participants: room.participants,
        name: room.name,
        password: room.password,
        hasPassword: room.hasPassword,
        createdAt: room.createdAt,
        loadfactor: room.loadfactor ?? 0.65,
    }

    cache.push(room)
    const capacity = cache.length
    if(capacity / baseCacheLimit >= 0.65) {
        syncCacheData()
        baseCacheLimit *= 2
    }
    
    await redisClient.set('chatroom', cache)
}

module.exports = {
    get,
    add,
    upsert,
    findById,
}