const aws = require('aws-sdk')
const s3 = new aws.S3({ region: 'ap-south-1' })

aws.config.update({ region: 'ap-south-1' })

exports.handler = async function (event, context) {
  console.log(JSON.stringify(event))

  let batchItemFailures = []
  for (const record of event.Records) {
    const payload = JSON.parse(record.body)
    console.log(record.messageId)
    try {
      if (![ 'SMS', 'EMAIL' ].includes(payload.mode)) {
        continue
      }

      if (payload.mode === 'SMS') {
        /*
       * await YourFunctionToSendSms();
       *    
      */
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
      }
    } catch (error) {
      console.log('Failure in processiong item', JSON.stringify(payload))
      batchItemFailures.push({ itemIdentifier: record.messageId })
    }
  }

  // Ref : https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#services-sqs-batchfailurereporting
  // BatchItemFailure will keep on retrying message until success or retention period expires so  better to delete it after certain ApproximateReceiveCount > yourlimits or use DLQ
  return { batchItemFailures: batchItemFailures }
}
