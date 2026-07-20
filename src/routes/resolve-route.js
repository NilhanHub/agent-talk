export const resolveRoute = ({ method, pathname }) => {
  if (method === "GET" && pathname === "/") {
    return "home";
  }

  if (method === "GET" && pathname === "/api/voices") {
    return "voices";
  }

  if (method === "POST" && pathname === "/api/chat") {
    return "chat";
  }

  if (method === "GET" && pathname.startsWith("/audio/") && pathname.endsWith(".mp3")) {
    return "audio";
  }

  if (method === "GET") {
    return "static";
  }

  return "not-found";
};
