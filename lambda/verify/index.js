const AWS = require('aws-sdk');

const clientId = process.env.CLIENT_ID;

exports.handler = async (event) => {

    const requestBody = JSON.parse(event.body);
    const { username, verificationCode } = requestBody;

    const cognito = new AWS.CognitoIdentityServiceProvider();

    const params = {
        Username: username,
        ConfirmationCode: verificationCode,
        ClientId: clientId,
    };

    try {
        await cognito.confirmSignUp(params).promise();
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            },
            body: JSON.stringify({ message: 'Successfully verified user' }),
        };
    } catch (error) {
        console.error('Error al verificar el usuario:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            },
            body: JSON.stringify({ message: 'Error verifying user' }),
        };
    }
};