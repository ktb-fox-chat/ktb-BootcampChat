const { ObjectId } = require('mongodb');
const redisClient = require('./redisClient');
const { syncCacheData } = require('./syncDBHandler')

let baseCacheLimit = 2

/**
 * 아이디 값을 매개로 채팅방을 조회합니다.
 */
const findById = async (roomId) => {
    let cache = await redisClient.get(`messages`)

    if(cache) {
        const messages = cache[roomId]
        return messages 
        ? messages.map(message => ({
            _id: new ObjectId(message._id),
            room: message.room,
            content: message.content,
            sender: new ObjectId(message.sender),
            type: message.type,
            file: new ObjectId(message.file),
            aiType: message.aiType,
            mentions: message.mentions,
            timestamp: new Date(message.timestamp),
            readers: message.readers.map(reader => ({
                userId: new ObjectId(reader.userId),
                readAt: new Date(reader.readAt)
            })),
            reactions: Object
            .keys(message.reactions)
            .map(
                (key) => message.reactions[key]
                .map(
                    (userId) => new ObjectId(userId)
                )
            ),
            metadata: message.metadata,
            isDeleted: message.isDeleted,
        })) 
        : null
    }
    return null
}

/**
 * 새로 생성된 혹은 적재되지 않은 채팅방 메세지를 캐시 데이터에 삽입합니다.</br>
 * 
 * 이미 존재하는 데이터일 경우, 무시합니다.
 */
const add = async (message) => {
    let cache = await redisClient.get(`messages`)
    if(!cache) cache = {}
    if(cache[message.room] !== undefined) {
        return
    }

    message =  {
        _id: new ObjectId(message._id),
        room: message.room,
        content: message.content,
        sender: new ObjectId(message.sender),
        type: message.type,
        file: new ObjectId(message.file),
        aiType: message.aiType,
        mentions: message.mentions,
        timestamp: new Date(message.timestamp),
        readers: message.readers(reader => ({
            userId: new ObjectId(reader.userId),
            readAt: new Date(reader.readAt)
        })),
        reactions: Object
        .keys(message.reactions)
        .map(
            (key) => message.reactions[key]
            .map(
                (userId) => new ObjectId(userId)
            )
        ),
        metadata: message.metadata,
        isDeleted: message.isDeleted,
    }

    cache[message.room].push(message)
    const capacity = Object
    .values(cache)
    .reduce((acc, messages) => acc += messages.length, 0)

    if(capacity / baseCacheLimit >= 0.65) {
        syncCacheData()
        baseCacheLimit *= 2
    }

    await redisClient.set('messages', cache)
}

/**
 * 새로 생성된 혹은 적재되지 않은 채팅방 메세지를 캐시 데이터에 삽입합니다.</br>
 * 
 * 이미 존재하는 데이터일 경우, 덮어 씌웁니다.
 */
const upsert = async (roomId, data) => {
    let cache = await redisClient.get(`messages`)
    if(!cache) cache = {}

    data = data.map(message => ({
        _id: new ObjectId(message._id),
        room: message.room,
        content: message.content,
        sender: new ObjectId(message.sender),
        type: message.type,
        file: new ObjectId(message.file),
        aiType: message.aiType,
        mentions: message.mentions,
        timestamp: new Date(message.timestamp),
        readers: message.readers(reader => ({
            userId: new ObjectId(reader.userId),
            readAt: new Date(reader.readAt)
        })),
        reactions: Object
        .keys(message.reactions)
        .map(
            (key) => message.reactions[key]
            .map(
                (userId) => new ObjectId(userId)
            )
        ),
        metadata: message.metadata,
        isDeleted: message.isDeleted,
    }))

    cache[roomId] = data

    const capacity = Object
    .values(cache)
    .reduce((acc, messages) => acc += messages.length, 0)

    if(capacity / baseCacheLimit >= 0.65) {
        syncCacheData()
        baseCacheLimit *= 2
    }

    await redisClient.set('messages', cache)
}

const set = async (data) => {
    await redisClient.set('messages', data)
}

module.exports = {
    add,
    upsert,
    set,
    findById,
}