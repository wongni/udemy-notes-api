"use strict";
const DynamoDB = require("aws-sdk/clients/dynamodb");
const documentClient = new DynamoDB.DocumentClient({
  region: "us-east-1",
  maxRetries: 3,
  httpOptions: {
    timeout: 5000,
  },
});
const NotesTableName = process.env.NOTES_TABLE_NAME || "";

function send(statusCode, data) {
  return {
    statusCode,
    body: JSON.stringify(data),
  }
}

module.exports.createNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  let data = JSON.parse(event.body);

  try {
    const params = {
      TableName: NotesTableName,
      Item: {
        id: data.id,
        title: data.title,
        body: data.body,
      },
      ConditionExpression: "attribute_not_exists(id)",
    };
    await documentClient.put(params).promise();
    callback(null, send(201, data))
  } catch (err) {
    callback(null, send(500, err.message))
  }
};

module.exports.updateNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  let noteId = event.pathParameters.id;
  let data = JSON.parse(event.body);

  try {
    const params = {
      TableName: NotesTableName,
      Key: {
        id: noteId
      },
      UpdateExpression: 'set #title = :title, #body = :body',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#body': 'body',
      },
      ExpressionAttributeValues: {
        ':title': data.title,
        ':body': data.body,
      },
      ConditionExpression: "attribute_exists(id)",
    };
    await documentClient.update(params).promise();
    callback(null, send(200, data))
  } catch (err) {
    callback(null, send(500, err.message))
  }
};

module.exports.deleteNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  let noteId = event.pathParameters.id;

  try {
    const params = {
      TableName: NotesTableName,
      Key: {
        id: noteId
      },
      ConditionExpression: "attribute_exists(id)",
    };
    await documentClient.delete(params).promise();
    callback(null, send(200, noteId))
  } catch (err) {
    callback(null, send(500, err.message))
  }
};

module.exports.getAllNotes = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  try {
    const params = {
      TableName: NotesTableName,
    };
    const notes = await documentClient.scan(params).promise();
    callback(null, send(200, notes))
  } catch (err) {
    callback(null, send(500, err.message))
  }
};
