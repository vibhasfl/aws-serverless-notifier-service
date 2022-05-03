const aws = require('aws-sdk');

exports.handler = async function (event, context) {
  console.log(JSON.stringify(event));
  return {
    statusCode: 200,
    headers: { 'content-type': 'text/json' },
    body: JSON.stringify({ message: 'Hello World !!' }),
  };
};
