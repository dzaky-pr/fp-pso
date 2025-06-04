const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

// Configure DynamoDB client for local development
const client = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "dummy",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "dummy",
  },
});

const dynamo = DynamoDBDocumentClient.from(client);
const tablename = process.env.TABLE_NAME || "books";

/* ──────────────────────────
   CRUD helper functions
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
   Local Lambda handler (for testing)
────────────────────────── */
const handler = async (event) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { httpMethod, pathParameters, body: requestBody } = event;
    const path = event.routeKey || `${httpMethod} ${event.path}`;

    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(`Processing: ${path}`);

    switch (path) {
      case "GET /books":
        body = await getAllBooks();
        break;

      case "GET /books/{id}":
        body = await getBook(pathParameters.id);
        break;

      case "PUT /books": {
        const bookData = JSON.parse(requestBody);
        body = await putBook(bookData);
        break;
      }

      case "DELETE /books/{id}":
        body = await deleteBook(pathParameters.id);
        break;

      default:
        statusCode = 404;
        body = { error: `Route not found: ${path}` };
    }
  } catch (err) {
    console.error("Error:", err);
    statusCode = 400;
    body = { error: err.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
    headers,
  };
};

/* ──────────────────────────
   Helper functions for testing
────────────────────────── */
const testConnection = async () => {
  try {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("Testing DynamoDB connection...");
    const result = await dynamo.send(new ScanCommand({ TableName: tablename }));
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("✅ Connection successful!");
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(`Found ${result.Items.length} books in the table`);
    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    return false;
  }
};

// Export functions for testing
module.exports = {
  handler,
  getBook,
  getAllBooks,
  putBook,
  deleteBook,
  testConnection,
};

// If running directly, test connection
if (require.main === module) {
  testConnection();
}
