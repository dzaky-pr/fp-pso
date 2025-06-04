const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tablename = process.env.TABLE_NAME || "books";

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

const getHealth = async () => {
  return { status: "ok" };
};

/* ──────────────────────────
   Lambda handler
────────────────────────── */
const handler = async (event) => {
  const forceError =
    event?.queryStringParameters?.forceError === "1" ||
    event?.headers?.["X-Force-Error"]?.toLowerCase?.() === "true" ||
    event?.headers?.["x-force-error"]?.toLowerCase?.() === "true";

  if (forceError) {
    console.error("🔥 Forced test error triggered");
    throw new Error("🔥 Forced error → should trip alarm");
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
      case "GET /health":
        body = await getHealth();
        break;
      default:
        throw new Error(`Unsupported route: ${event.routeKey}`);
    }
  } catch (error) {
    statusCode = 400;
    body = error.message;
    console.error("🔥 [ERROR]", error); // log detail error juga
  } finally {
    body = JSON.stringify(body);
  }

  return { statusCode, body, headers };
};

module.exports = { handler };
