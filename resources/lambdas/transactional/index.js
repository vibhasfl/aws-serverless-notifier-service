const aws = require('aws-sdk')
const s3 = new aws.S3({ region: 'ap-south-1' })

aws.config.update({ region: 'ap-south-1' })

exports.handler = async function (event, context) {
  try {
    console.log(JSON.stringify(event))

    const record = event.Records.pop()

    const payload = JSON.parse(record.body)

    if (![ 'SMS', 'EMAIL' ].includes(payload.mode)) {
      return {
        statusCode: 400,
        headers: { 'content-type': 'text/json' },
        body: JSON.stringify({ errorMessage: 'Invalid mode' })
      }
    }

    if (payload.mode === 'SMS') {
      /*
       * await YourFunctionToSendSms();
       *    
      */
      return {
        statusCode: 200,
        headers: { 'content-type': 'text/json' },
        body: JSON.stringify({ message: 'Success' })
      }
    } else if (payload.mode === 'EMAIL') {
      // Check if S3 key exists and get object from S3
      if (payload.s3FileKey) {
        const s3File = await s3.getObject({ Bucket: process.env.emailUploadBucket, Key: `${payload.s3FileKey}.json` }).promise()
        const s3EmailMessage = JSON.parse(s3File.Body.toString())
        console.log('s3EmailMessage', s3EmailMessage)
      } else {
        const { htmlMailBody, attachments } = payload
        console.log('htmlMailBody', htmlMailBody)
      }
      /*
       * await YourFunctionToSendEmail();
       *
      */

      // Delete s3 file after successfully sending email
      if (payload.s3FileKey) await s3.deleteObject({ Bucket: process.env.emailUploadBucket, Key: `${payload.s3FileKey}.json` }).promise()

      return {
        statusCode: 200,
        headers: { 'content-type': 'text/json' },
        body: JSON.stringify({ message: 'Success' })
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'text/json' },
      body: JSON.stringify({ errorMessage: error.toString() })
    }
  }
}
