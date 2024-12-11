const AWS = require('aws-sdk');
const url = require('url');

const bucketName = process.env.AWS_BUCKET_NAME; // 환경 변수에서 S3 버킷 이름 가져오기

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY, // accessKeyId로 수정
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});


const deleteFileFromS3 = async (fileUrl) => {
  try {
   // URL에서 S3 객체 키 추출
   const parsedUrl = url.parse(fileUrl);
   const key = parsedUrl.pathname.replace(`/${bucketName}/`, '').substring(1); // 슬래시 제거

   const params = {
     Bucket: bucketName,
     Key: key,
   };

   // S3 객체 삭제
   await s3.deleteObject(params).promise();
    console.debug(`성공적으로 파일 삭제가 완료되었습니다. Key: ${key}`);
    return { message: 'File deleted successfully', key };
  } catch (error) {
    console.error('S3 이미지 파일 삭제 중 오류가 발생했습니다. :', error);
    throw error;
  }
};

module.exports = deleteFileFromS3;
