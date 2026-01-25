import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.INCIDENTS_TABLE_NAME!;

function parseLimit(value: any, fallback = 20) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
}

function parseLastKey(raw: any) {
  if (!raw || raw === "null" || raw === "undefined") return undefined;
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export const handler = async (event: any) => {
  const qs = event?.queryStringParameters ?? {};
  const limit = parseLimit(qs.limit, 20);
  const exclusiveStartKey = parseLastKey(qs.lastKey);

  // Optional filters (applied after Query)
  const severity = qs.severity;
  const service = qs.service;

  const filterParts: string[] = [];
  const values: Record<string, any> = { ":all": "ALL" };

  if (severity) {
    values[":severity"] = severity;
    filterParts.push("severity = :severity");
  }
  if (service) {
    values[":service"] = service;
    filterParts.push("service = :service");
  }

  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1_AllByCreatedAt",
      KeyConditionExpression: "gsi1pk = :all",
      ExpressionAttributeValues: values,
      FilterExpression: filterParts.length ? filterParts.join(" AND ") : undefined,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
      ScanIndexForward: false, // NEWEST FIRST ✅
    })
  );

  const nextKey = res.LastEvaluatedKey
    ? encodeURIComponent(JSON.stringify(res.LastEvaluatedKey))
    : null;

  return {
    statusCode: 200,
    body: JSON.stringify({ items: res.Items ?? [], lastKey: nextKey }),
  };
};