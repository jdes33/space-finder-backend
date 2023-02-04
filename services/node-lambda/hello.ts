import { APIGatewayProxyEvent } from "aws-lambda";
import { S3 } from "aws-sdk";

const s3Client = new S3();

async function handler(event: any, context: any) {
    const buckets = await s3Client.listBuckets().promise();
    console.log('Got an event:');
    console.log(event);

    if (isAuthorised(event)) {
        return {
            statusCode: 200,
            body: JSON.stringify('Hey you are authorised as admin')
        }
    } else {
        return {
            statusCode: 401,
            body: JSON.stringify('You are NOT authorised')
        }
    }

    

}

function isAuthorised(event: APIGatewayProxyEvent) {
    const groups = event.requestContext.authorizer?.claims['cognito:groups'];
    if (groups) {
        return (groups as string).includes('admins');
    } else {
        return false
    }
}

export { handler }