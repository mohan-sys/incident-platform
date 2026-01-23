import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.INCIDENTS_TABLE_NAME!;

function parseLimit(value: any, fallback = 20) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
}

export const handler = async (event: any) => {
  const qs = event?.queryStringParameters ?? {};

  const status = qs.status;
  const severity = qs.severity;
  const service = qs.service;
  const limit = parseLimit(qs.limit, 20);

  // Pass lastKey as: encodeURIComponent(JSON.stringify(LastEvaluatedKey))
  const lastKeyRaw = qs.lastKey;

    // Treat "", "null", "undefined" as “not provided”
    let exclusiveStartKey: any = undefined;

    if (lastKeyRaw && lastKeyRaw !== "null" && lastKeyRaw !== "undefined") {
    try {
        const parsed = JSON.parse(decodeURIComponent(lastKeyRaw));
        if (parsed && typeof parsed === "object") {
        exclusiveStartKey = parsed;
        }
    } catch {
        // If lastKey is invalid, return 400 instead of 500
        return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid lastKey" }),
        };
    }
    }

  const filterParts: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, any> = {};

  if (status) {
    names["#status"] = "status";
    values[":status"] = status;
    filterParts.push("#status = :status");
  }

  if (severity) {
    values[":severity"] = severity;
    filterParts.push("severity = :severity");
  }

  if (service) {
    values[":service"] = service;
    filterParts.push("service = :service");
  }

  const res = await ddb.send(
    new ScanCommand({
      TableName: tableName,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
      FilterExpression: filterParts.length ? filterParts.join(" AND ") : undefined,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
    })
  );

  const nextKey = res.LastEvaluatedKey
    ? encodeURIComponent(JSON.stringify(res.LastEvaluatedKey))
    : null;

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: res.Items ?? [],
      lastKey: nextKey,
    }),
  };
};