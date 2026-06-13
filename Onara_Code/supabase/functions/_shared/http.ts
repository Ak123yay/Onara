export const jsonHeaders = {
  "content-type": "application/json",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

export function requireMethod(request: Request, method: string): Response | null {
  if (request.method === method) {
    return null;
  }

  return jsonResponse({ error: "method_not_allowed" }, 405);
}

export function requireBearerSecret(request: Request, secret: string): Response | null {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  if (secret && header === expected) {
    return null;
  }

  return jsonResponse({ error: "unauthorized" }, 401);
}
