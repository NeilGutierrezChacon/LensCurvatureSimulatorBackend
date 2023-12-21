const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const userPoolId = process.env.USER_POOL_ID;
const clientId = process.env.CLIENT_ID;

exports.handler = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);

        const { username, password } = requestBody;

        const authenticationData = {
            Username: username,
            Password: password,
        };

        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

        const userData = {
            Username: username,
            Pool: new AmazonCognitoIdentity.CognitoUserPool({
                UserPoolId: userPoolId,
                ClientId: clientId,
            }),
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        const session = await new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (session) => resolve(session),
                onFailure: (err) => reject(err),
            });
        });

        const accessToken = session.getAccessToken().getJwtToken();
        const idToken = session.getIdToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            },
            body: JSON.stringify({ message: 'Inicio de sesión exitoso', accessToken: accessToken, idToken: idToken, refreshToken: refreshToken }),
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
            body: JSON.stringify({ message: "Server internal error." }),
        };
    }
};