import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.INCIDENTS_TABLE_NAME!;

type Action = "ACK" | "RESOLVE";

export const handler = async (event: any) => {
  try {
    const id = event?.pathParameters?.id;
    const body = event?.body ? JSON.parse(event.body) : null;
    const action: Action | undefined = body?.action;

    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing incident id" }) };
    }

    if (action !== "ACK" && action !== "RESOLVE") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'action must be "ACK" or "RESOLVE"' }),
      };
    }

    const now = new Date().toISOString();

    let UpdateExpression: string;
    let ExpressionAttributeValues: Record<string, any>;
    let ExpressionAttributeNames: Record<string, string> | undefined;

    if (action === "ACK") {
      UpdateExpression = "SET acknowledgedAt = :t";
      ExpressionAttributeValues = { ":t": now };
    } else {
      UpdateExpression = "SET resolvedAt = :t, #s = :status";
      ExpressionAttributeNames = { "#s": "status" };
      ExpressionAttributeValues = { ":t": now, ":status": "RESOLVED" };
    }

    const result = await ddb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { incidentId: id },
        UpdateExpression,
        ExpressionAttributeValues,
        ExpressionAttributeNames,
        ReturnValues: "ALL_NEW",
      })
    );

    return { statusCode: 200, body: JSON.stringify({ item: result.Attributes }) };
  } catch (err) {
    console.error("Update incident failed", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};