export const jsonResponse = (data, init = {}) =>
  Response.json(data, {
    status: init.status ?? 200,
    headers: init.headers,
  });
