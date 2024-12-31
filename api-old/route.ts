export async function GET() {
  const data = { message: "Hello, World!" }
 
  return Response.json({ data })
}

