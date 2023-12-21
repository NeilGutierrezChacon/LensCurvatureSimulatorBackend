const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

exports.handler = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { username, password } = requestBody;

        const poolData = {
            UserPoolId: process.env.USER_POOL_ID,
            ClientId: process.env.CLIENT_ID,
        };

        const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

        const attributeList = [];

        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: 'email', Value: username }));

        await new Promise((resolve, reject) => {
            userPool.signUp(username, password, attributeList, null, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            },
            body: JSON.stringify({ message: 'Usuario registrado exitosamente' }),
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
            body: JSON.stringify({ error: 'Error durante el registro del usuario' }),
        };
    }
};