const aws = require('aws-sdk')
const sqs = new aws.SQS()
const uuid = require('uuid')
const crypto = require('crypto')

exports.handler = async function (event, context) {
  console.log(JSON.stringify(event))
  try {
    // prettier-ignore
    if (event.requestContext.http.method && event.requestContext.http.method !== 'POST') {
    return {
      statusCode: 400,
      headers: { 'content-type': 'text/json' },
      body: JSON.stringify({ errorMessage: 'Invalid Method' })
    }
  }

    if (![ '/sms', '/email' ].includes(event.requestContext.http.path)) {
      return {
        statusCode: 400,
        headers: { 'content-type': 'text/json' },
        body: JSON.stringify({ errorMessage: 'Invalid Route' })
      }
    }

    const payload = JSON.parse(event.body)

    if (event.requestContext.http.path === '/sms') {
      const payloadValidResponse = validateSmsPayload(payload)

      if (!payloadValidResponse.status) {
        return {
          statusCode: 400,
          headers: { 'content-type': 'text/json' },
          body: JSON.stringify({ errorMessage: 'Invalid payload', data: payloadValidResponse.errors })
        }
      }

      await sqs
        .sendMessage({
          QueueUrl: payload.type === 'TRANSACTIONAL' ? process.env.txnlSqsQueue : process.env.prmtlSqsQueue,
          MessageBody: JSON.stringify(payload),
          MessageGroupId: payload.type,
          MessageDeduplicationId: crypto.createHash('md5').update(payload.message).digest('hex')
        })
        .promise()

      return {
        statusCode: 200,
        headers: { 'content-type': 'text/json' },
        body: JSON.stringify({ message: 'SMS send success' })
      }
    } else {
      const payloadValidResponse = validateEmailPayload(payload)

      if (!payloadValidResponse.status) {
        return {
          statusCode: 400,
          headers: { 'content-type': 'text/json' },
          body: JSON.stringify({ errorMessage: 'Invalid payload', data: payloadValidResponse.errors })
        }
      }

      const totalEmailSizeIncludingAttachmentsInMb = getTotalEmailSize(payload)

      if (totalEmailSizeIncludingAttachmentsInMb > (process.env.MAX_EMAIL_SIZE || 1)) {
        return {
          statusCode: 400,
          headers: { 'content-type': 'text/json' },
          body: JSON.stringify({ errorMessage: `Email size cannot exceed ${process.env.MAX_EMAIL_SIZE}MB` })
        }
      }

      const { s3FileKey, s3Response } = await uploadEmailPayloadToS3(payload)

      delete payload.htmlMailBody
      delete payload.attachments
      payload.s3FileKey = s3FileKey

      const sqsResp = await sqs
        .sendMessage({
          QueueUrl: payload.type === 'TRANSACTIONAL' ? process.env.txnlSqsQueue : process.env.prmtlSqsQueue,
          MessageBody: JSON.stringify(payload),
          MessageGroupId: payload.type,
          MessageDeduplicationId: crypto.createHash('md5').update(uploadJson.html).digest('hex')
        })
        .promise()

      return {
        statusCode: 200,
        headers: { 'content-type': 'text/json' },
        body: JSON.stringify({ message: 'Email send success' })
      }
    }
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'text/json' },
      body: JSON.stringify({ message: error.toString() })
    }
  }
}

/**
 * @typedef {Object} payloadValidResponse
 * @property {boolean} status - Indicates whether sms payload is valid or not
 * @property {object} errors  - Contains errors if any
 * @returns {payloadValidResponse}  
 * 
 * @param {object} payload
 * @param {string} payload.type - Indicates wheather message is PROMOTIONAL or TRANSACTIONAL
 * @param {string} payload.message - Text Message to send
 * @param {[string]} payload.mobileNos - Array of mobile no's to send SMS to
 * @param {object} payload.props - Extra data if any
 * @type {{type:(PROMOTIONAL|TRANSACTIONAL),message:string,mobileNos:[string],origin:object}}
*/

const validateSmsPayload = (payload) => {
  return {
    status: true,
    errors: []
  }
}

/**
 * @returns {payloadValidResponse}  
 *
 * @typedef {Object} attachments
 * @property {string} fileName - Name of file
 * @property {string} content  - base64 Content
 *
 * 
 * @param {object} payload
 * @param {string} payload.type - Indicates wheather message is PROMOTIONAL or TRANSACTIONAL
 * @param {string} payload.subject - Email subject
 * @param {string} payload.htmlMailBody - HTML email Message to send
 * @param {[string]} payload.toEmailIds - Array of emailids
 * @param {[string]} payload.ccEmailIds - Array of emailids
 * @param {attachments} payload.attachments - Array of emailids
 * @param {object} payload.props - Extra data if any
 * @type {{type:(PROMOTIONAL|TRANSACTIONAL),message:string,mobileNos:[string],origin:object}}
*/

const validateEmailPayload = (payload) => {
  return {
    status: true,
    errors: []
  }
}

const getTotalEmailSize = (payload) => {
  const htmlEmailBodySizeInBytes = Buffer.byteLength(payload.htmlMailBody, 'utf8')

  const totalAttachmentSizeInBytes = payload.attachments.reduce((a, c) => a + Buffer.byteLength(c.content, 'base64'), 0)

  return (htmlEmailBodySizeInBytes + totalAttachmentSizeInBytes) * 0.000001
}

const uploadEmailPayloadToS3 = async (payload) => {
  const uploadJson = {
    html: payload.htmlMailBody,
    attachments: payload.attachments
  }
  const s3FileKey = uuid.v4()

  const s3Response = await s3
    .putObject({
      Bucket: process.env.emailUploadBucket,
      Key: `${s3FileKey}.json`,
      Body: JSON.stringify(uploadJson),
      ContentType: 'text/json'
    })
    .promise()

  return { s3Response, s3FileKey }
}
