const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME;

exports.handler = async (event, context) => {
    try {
        const requestBody = JSON.parse(event.body);

        const { n, d, r1, r2, f, createdAt } = requestBody;
        const userId = event.requestContext.authorizer.claims.sub;

        await dynamoDB.put({
            TableName: tableName,
            Item: {
                uuid: context.awsRequestId,
                userId,
                f,
                n,
                d,
                r1,
                r2,
                createdAt
            },
        }).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            },
            body: JSON.stringify({ message: 'Data saved successfully' }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            },
            body: JSON.stringify({ error: 'There was an error processing the request' }),
        };
    }
};