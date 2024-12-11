const mongoose = require('mongoose');

const User = require('../models/User')
const Room = require('../models/Room')
const Message = require('../models/Message')
const File = require('../models/File')

const clearUsers = async () => {
    console.debug("유저 정보 삭제를 시작합니다...")
    return await User
    .deleteMany()
    .then((result) => {
        console.debug("유저 정보가 모두 삭제되었습니다.")
        console.debug(`결과: ${result.deletedCount} 삭제`)
        return result.deletedCount
    })
    .catch((e) => {
        console.error("유저 정보 삭제에 실패했습니다.")
        throw e
    })
} 

const clearRoom = async () => {
    console.debug("유저 채팅방 삭제를 시작합니다...")
    return await Room
    .deleteMany()
    .then((result) => {
        console.debug("채팅방 정보가 모두 삭제되었습니다.")
        console.debug(`결과: ${result.deletedCount} 삭제`)
        return result.deletedCount
    })
    .catch((e) => {
        console.error("채팅방 정보 삭제에 실패했습니다.")
        throw e
    })
} 

const clearFile = async () => {
    console.debug("파일 정보 삭제를 시작합니다...")
    return await File
    .deleteMany()
    .then((result) => {
        console.debug("파일 정보가 모두 삭제되었습니다.")
        console.debug(`결과: ${result.deletedCount} 삭제`)
        return result.deletedCount
    })
    .catch((e) => {
        console.error("파일 정보 삭제에 실패했습니다.")
        throw e
    })
} 

const clearMessage = async () => {
    console.debug("채팅 메세지 정보 삭제를 시작합니다...")
    return await Message
    .deleteMany()
    .then((result) => {
        console.debug("채팅 메세지 정보가 모두 삭제되었습니다.")
        console.debug(`결과: ${result.deletedCount} 삭제`)
        return result.deletedCount
    })
    .catch((e) => {
        console.error("채팅 메세지 정보 삭제에 실패했습니다.")
        throw e
    })
} 

(async function() {
    console.log("테스트에 사용된 데이터를 삭제 합니다.")
    console.log("몽고 디비 연결중...")

    await mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('몽고 디비 연결완료.'))
    .catch(err => {
        console.error('몽고 디비 연결중 오류가 발생했습니다:', err);
        process.exit(1);
    });

    await Promise.all([
        clearUsers(),
        clearRoom(),
        clearMessage(),
        clearFile(),
    ])
    .then(() => console.debug(`모든 데이터가 삭제 되었습니다.`))
    .catch((e) => {
        console.error(e)
        return
    })
    .finally(() => { process.exit(1) })
})()