import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class LensCurvatureSimulatorBackendStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const userPool = new cognito.UserPool(this, 'LensCurvatureSimulatorUsers', {
            selfSignUpEnabled: true,
            autoVerify: { email: true },
            customAttributes: {
                email: new cognito.StringAttribute()
            },
        });

        const userPoolClientId = userPool.addClient('LensCurvatureSimulatorUsersClient').userPoolClientId;

        const table = new dynamodb.Table(this, 'LensCurvatureSimulatorParameters', {
            partitionKey: { name: 'uuid', type: dynamodb.AttributeType.STRING },
        });

        const tableUserIdIndexName = "UserIdIndex";
        table.addGlobalSecondaryIndex({
            indexName: tableUserIdIndexName,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        const lambdaLayer = new lambda.LayerVersion(this, 'LensCurvatureSimulatorLambdaLayer', {
            code: lambda.Code.fromAsset("lambdaLayer"),
            compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
            description: 'My custom Lambda Layer',
        });


        const lambdaFunctionSaveParameters = new lambda.Function(this, 'LensCurvatureSimulatorSaveParameters', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/saveParameters'),
            layers: [lambdaLayer],
            environment: {
                TABLE_NAME: table.tableName,
            },
        });

        table.grantWriteData(lambdaFunctionSaveParameters);


        const lambdaFunctionGetParametersByUserId = new lambda.Function(this, 'LensCurvatureSimulatorGetParametersByUserId', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/getParameters'),
            layers: [lambdaLayer],
            environment: {
                TABLE_NAME: table.tableName,
                TABLE_USER_ID_INDEX: tableUserIdIndexName
            },
        });

        table.grantReadData(lambdaFunctionGetParametersByUserId);

        // Define la función Lambda para inicio de sesión
        const lambdaFunctionLogin = new lambda.Function(this, 'LensCurvatureSimulatorLogin', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/login'),
            layers: [lambdaLayer],
            timeout: cdk.Duration.seconds(60),
            environment: {
                TABLE_NAME: table.tableName,
                USER_POOL_ID: userPool.userPoolId,
                CLIENT_ID: userPoolClientId,
            },
        });

        const lambdaFunctionSignUp = new lambda.Function(this, 'LensCurvatureSimulatorSignUp', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/signup'),
            timeout: cdk.Duration.seconds(60),
            layers: [lambdaLayer],
            environment: {
                USER_POOL_ID: userPool.userPoolId,
                CLIENT_ID: userPoolClientId,
            },
        });

        const lambdaFunctionVerify = new lambda.Function(this, 'LensCurvatureSimulatorVerify', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/verify'),
            timeout: cdk.Duration.seconds(60),
            layers: [lambdaLayer],
            environment: {
                USER_POOL_ID: userPool.userPoolId,
                CLIENT_ID: userPoolClientId,
            },
        });

        // userPool.grantInvoke(lambdaFunctionSignUp);

        const api = new apigateway.RestApi(this, 'LensCurvatureSimulatorApi', {
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
            },
        });

        // LogIn
        const loginResource = api.root.addResource('login');
        const loginIntegration = new apigateway.LambdaIntegration(lambdaFunctionLogin);
        loginResource.addMethod('POST', loginIntegration);


        // SignUp
        const signUpResource = api.root.addResource('signUp');
        const signUpIntegration = new apigateway.LambdaIntegration(lambdaFunctionSignUp);
        signUpResource.addMethod('POST', signUpIntegration);

        // Verify user
        const verifyResource = api.root.addResource('verify');
        const verifyIntegration = new apigateway.LambdaIntegration(lambdaFunctionVerify);
        verifyResource.addMethod('POST', verifyIntegration);



        const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'LensCurvatureSimulatorAuthorizer', {
            cognitoUserPools: [userPool],
        });

        // SaveParameters
        const resource = api.root.addResource('saveParameters');
        const saveParametersIntegration = new apigateway.LambdaIntegration(lambdaFunctionSaveParameters);

        resource.addMethod('POST', saveParametersIntegration, {
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizer,
        });

        // GetParametersByUserId
        const getParametersByUserIdResource = api.root.addResource('getParametersByUserId');
        const getParametersByUserIdResourceIntegration = new apigateway.LambdaIntegration(lambdaFunctionGetParametersByUserId);

        getParametersByUserIdResource.addMethod('GET', getParametersByUserIdResourceIntegration, {
            authorizationType: apigateway.AuthorizationType.COGNITO,
            authorizer,
        });

    }
}
