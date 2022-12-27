"use strict";

const { CognitoJwtVerifier } = require("aws-jwt-verify");

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID
const COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID

const verifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USER_POOL_ID,
  tokenUse: "id",
  clientId: COGNITO_WEB_CLIENT_ID,
});

function send(statusCode, data) {
  return {
    statusCode,
    body: JSON.stringify(data),
  }
}

module.exports.handler = async (event, context, callback) => {
  var token = event.authorizationToken; // allow or deny
  console.log(token);
  try {
    const payload = await verifier.verify(token)
    console.log(JSON.stringify(payload));
    callback(null, generatePolicy("user", "Allow", event.methodArn))
  } catch (err) {
    console.error(JSON.stringify(err));
    callback(null, send(500, err.message))
  }
};

function generatePolicy(principalId, effect, resource) {
  var authResponse = {}
  authResponse.principalId = principalId;
  if (effect && resource) {
    let policyDocument = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": effect,
          "Action": "execute-api:Invoke",
          "Resource": resource
        },
      ]
    }
    authResponse.policyDocument = policyDocument
  }
  authResponse.context = {
    foo: "bar"
  }
  console.log(JSON.stringify(authResponse));
  return authResponse
}

