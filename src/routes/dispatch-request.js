import { resolveRoute } from "./resolve-route.js";

export const dispatchRequest = ({ request, handlers }) => {
  const { pathname } = new URL(request.url);
  const { method } = request;
  const route = resolveRoute({ method, pathname });
  const handler = handlers[route];

  if (!handler) {
    return new Response("Not found", { status: 404 });
  }

  return handler(request);
};
