import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { corsHeaders } from "../../frontend/src/lib/cors";

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
  // CORS preflight
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }
  const qs = event?.queryStringParameters ?? {};

  const status = qs.status; // OPEN | RESOLVED (optional)
  const severity = qs.severity;
  const service = qs.service;

  const limit = parseLimit(qs.limit, 20);
  const exclusiveStartKey = parseLastKey(qs.lastKey);

  // Optional filters (applied after Query)
  const filterParts: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, any> = {};

  if (severity) {
    values[":severity"] = severity;
    filterParts.push("severity = :severity");
  }

  if (service) {
    values[":service"] = service;
    filterParts.push("service = :service");
  }

  // Choose index based on query pattern
  let IndexName: string;
  let KeyConditionExpression: string;

  if (status) {
    IndexName = "GSI2_StatusByCreatedAt";
    names["#status"] = "status";
    values[":status"] = status;
    KeyConditionExpression = "#status = :status";
  } else {
    IndexName = "GSI1_AllByCreatedAt";
    values[":all"] = "ALL";
    KeyConditionExpression = "gsi1pk = :all";
  }

  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName,
      KeyConditionExpression,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
      FilterExpression: filterParts.length ? filterParts.join(" AND ") : undefined,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
      ScanIndexForward: false, // newest first
    })
  );

  const nextKey = res.LastEvaluatedKey
    ? encodeURIComponent(JSON.stringify(res.LastEvaluatedKey))
    : null;

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ items: res.Items ?? [], lastKey: nextKey }),
  };
};