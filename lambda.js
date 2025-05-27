import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tablename = "books";
/* ──────────────────────────
   CRUD helper
────────────────────────── */
const getBook = async (id) => {
  const result = await dynamo.send(
    new GetCommand({ TableName: tablename, Key: { id: Number(id) } }),
  );
  return result.Item || { message: "not found" };
};

const getAllBooks = async () => {
  const result = await dynamo.send(new ScanCommand({ TableName: tablename }));
  return result.Items;
};

const putBook = async (book) => {
  await dynamo.send(
    new PutCommand({
      TableName: tablename,
      Item: {
        id: Number(book.id),
        price: book.price,
        author: book.author,
        description: book.description,
        title: book.title,
      },
    }),
  );
  return `PUT book ${book.id}`;
};

const deleteBook = async (id) => {
  await dynamo.send(
    new DeleteCommand({ TableName: tablename, Key: { id: Number(id) } }),
  );
  return `Deleted Book ${id}`;
};

/* ──────────────────────────
   Lambda handler
────────────────────────── */
export const handler = async (event) => {
  /* ====== BLOK TEST ERROR ====== */
  const wantError =
    event?.queryStringParameters?.forceError === "1" ||
    event?.headers?.["X-Force-Error"] === "true";

  if (wantError) {
    console.error("🔥 Forced test error for CloudWatch");
    throw new Error("Forced error → should trip alarm");
  }
  /* ====== END TEST ERROR BLOCK === */

  let body;
  let statusCode = 200;
  const headers = { "Content-Type": "application/json" };

  try {
    switch (event.routeKey) {
      case "GET /books/{id}":
        body = await getBook(event.pathParameters.id);
        break;
      case "GET /books":
        body = await getAllBooks();
        break;
      case "PUT /books": {
        const data = JSON.parse(event.body);
        body = await putBook(data);
        break;
      }
      case "DELETE /books/{id}":
        body = await deleteBook(event.pathParameters.id);
        break;
      default:
        throw new Error(`Unsupported route: ${event.routeKey}`);
    }
  } catch (error) {
    statusCode = 400;
    body = error.message;
  } finally {
    body = JSON.stringify(body);
  }

  return { statusCode, body, headers };
};
