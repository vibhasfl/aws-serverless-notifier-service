const aws = require('aws-sdk')

exports.handler = async function (event, context) {
  console.log(JSON.stringify(event))

  const payload = JSON.parse(event.body)

  if (payload.mode === 'SMS') {
    // Your code to send SMS
  } else if (payload.mode === 'EMAIL') {
    // Your code to send EMAIL
  } else {
    return {
      statusCode: 400,
      headers: { 'content-type': 'text/json' },
      body: JSON.stringify({ errorMessage: 'Invalid mode' })
    }
  }
}
