import { APIGatewayProxyEvent } from "aws-lambda";

export function generateRandomId(): string {
    // generates a number, comverts to string, then remove first 2 chars as it's just '0.'
    return Math.random().toString(36).slice(2);
}

// this function is jsut make to wrap up the line within into a nice clean meaningful function
export function getEventBody(event: APIGatewayProxyEvent){
    return typeof event.body == 'object' ? event.body: JSON.parse(event.body);
}