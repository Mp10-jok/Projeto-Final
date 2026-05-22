const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;
const DATABASE_FILE = path.join(BASE_DIR, "database.json");

const users = [
  {
    username: "marcio",
    password: "123",
    role: "Funcionario",
    allowedAreas: ["Recepcao", "Escritorio"]
  },
  {
    username: "bruce",
    password: "123",
    role: "Gerente",
    allowedAreas: ["Recepcao", "Escritorio", "Laboratorio"]
  },
  {
    username: "alfred",
    password: "123",
    role: "Administrador de seguranca",
    allowedAreas: ["Recepcao", "Escritorio", "Laboratorio", "Sala de servidores", "Garagem"]
  }
];

const areas = ["Recepcao", "Escritorio", "Laboratorio", "Sala de servidores", "Garagem"];

const defaultDatabase = {
  resources: [
    { id: 1, name: "Camera Intelbras", type: "Dispositivo de seguranca", status: "Disponivel" },
    { id: 2, name: "Batmovel de ronda", type: "Veiculo", status: "Em uso" },
    { id: 3, name: "Radio comunicador", type: "Equipamento", status: "Manutencao" }
  ],
  activities: [
    { user: "alfred", role: "Administrador de seguranca", action: "Atualizou inventario", result: "Sucesso" },
    { user: "bruce", role: "Gerente", action: "Acesso ao Laboratorio", result: "Liberado" },
    { user: "marcio", role: "Funcionario", action: "Acesso a Sala de servidores", result: "Bloqueado" }
  ]
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function ensureDatabaseFile() {
  if (!fs.existsSync(DATABASE_FILE)) {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(defaultDatabase, null, 2));
  }
}

function readDatabase() {
  ensureDatabaseFile();
  return JSON.parse(fs.readFileSync(DATABASE_FILE, "utf-8"));
}

function writeDatabase(data) {
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(data, null, 2));
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function sendNotFound(response) {
  sendJson(response, 404, { message: "Rota nao encontrada." });
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath);
  const contentType = mimeTypes[extension] || "text/plain; charset=utf-8";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Erro interno do servidor.");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("JSON invalido."));
      }
    });
  });
}

function publicUser(user) {
  return {
    username: user.username,
    role: user.role,
    allowedAreas: user.allowedAreas
  };
}

function findUser(username) {
  return users.find((item) => item.username === username);
}

function canManageResources(user) {
  return user && (user.role === "Gerente" || user.role === "Administrador de seguranca");
}

function handleStaticFile(request, response) {
  const requestPath = request.url === "/" ? "/index.html" : request.url;
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(BASE_DIR, safePath);

  if (!filePath.startsWith(BASE_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendNotFound(response);
    return;
  }

  sendFile(response, filePath);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname;

  try {
    if (request.method === "GET" && pathname === "/api/config") {
      sendJson(response, 200, {
        areas,
        totalUsers: users.length
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/login") {
      const body = await readBody(request);
      const user = users.find((item) => item.username === body.username && item.password === body.password);

      if (!user) {
        sendJson(response, 401, { message: "Usuario ou senha invalidos." });
        return;
      }

      sendJson(response, 200, { user: publicUser(user) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/resources") {
      const database = readDatabase();
      sendJson(response, 200, { resources: database.resources });
      return;
    }

    if (request.method === "GET" && pathname === "/api/activities") {
      const database = readDatabase();
      sendJson(response, 200, { activities: database.activities });
      return;
    }

    if (request.method === "POST" && pathname === "/api/access-check") {
      const body = await readBody(request);
      const user = findUser(body.username);

      if (!user) {
        sendJson(response, 404, { message: "Usuario nao encontrado." });
        return;
      }

      const database = readDatabase();
      const allowed = user.allowedAreas.includes(body.area);
      const activity = {
        user: user.username,
        role: user.role,
        action: `Tentou acessar ${body.area}`,
        result: allowed ? "Liberado" : "Bloqueado"
      };

      database.activities.push(activity);
      writeDatabase(database);

      sendJson(response, 200, {
        allowed,
        message: allowed
          ? `Acesso liberado para ${body.area}.`
          : `Acesso bloqueado para ${body.area}.`
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/resources") {
      const body = await readBody(request);
      const user = findUser(body.actor);

      if (!canManageResources(user)) {
        sendJson(response, 403, { message: "Seu perfil nao tem permissao para cadastrar recursos." });
        return;
      }

      const database = readDatabase();
      const resource = {
        id: Date.now(),
        name: body.name,
        type: body.type,
        status: body.status
      };

      database.resources.push(resource);
      database.activities.push({
        user: user.username,
        role: user.role,
        action: `Cadastrou recurso ${resource.name}`,
        result: "Sucesso"
      });
      writeDatabase(database);

      sendJson(response, 201, { resource });
      return;
    }

    if (request.method === "PUT" && pathname.startsWith("/api/resources/")) {
      const body = await readBody(request);
      const user = findUser(body.actor);

      if (!canManageResources(user)) {
        sendJson(response, 403, { message: "Seu perfil nao tem permissao para atualizar recursos." });
        return;
      }

      const resourceId = Number(pathname.split("/").pop());
      const database = readDatabase();
      const resourceIndex = database.resources.findIndex((item) => item.id === resourceId);

      if (resourceIndex === -1) {
        sendJson(response, 404, { message: "Recurso nao encontrado." });
        return;
      }

      database.resources[resourceIndex] = {
        id: resourceId,
        name: body.name,
        type: body.type,
        status: body.status
      };
      database.activities.push({
        user: user.username,
        role: user.role,
        action: `Atualizou recurso ${body.name}`,
        result: "Sucesso"
      });
      writeDatabase(database);

      sendJson(response, 200, { resource: database.resources[resourceIndex] });
      return;
    }

    if (request.method === "DELETE" && pathname.startsWith("/api/resources/")) {
      const body = await readBody(request);
      const user = findUser(body.actor);

      if (!canManageResources(user)) {
        sendJson(response, 403, { message: "Seu perfil nao tem permissao para remover recursos." });
        return;
      }

      const resourceId = Number(pathname.split("/").pop());
      const database = readDatabase();
      const resource = database.resources.find((item) => item.id === resourceId);

      if (!resource) {
        sendJson(response, 404, { message: "Recurso nao encontrado." });
        return;
      }

      database.resources = database.resources.filter((item) => item.id !== resourceId);
      database.activities.push({
        user: user.username,
        role: user.role,
        action: `Removeu recurso ${resource.name}`,
        result: "Sucesso"
      });
      writeDatabase(database);

      sendJson(response, 200, { message: "Recurso removido com sucesso." });
      return;
    }

    if (request.method === "POST" && pathname === "/api/reset") {
      const body = await readBody(request);
      const user = findUser(body.actor);

      if (!canManageResources(user)) {
        sendJson(response, 403, { message: "Seu perfil nao tem permissao para restaurar os dados." });
        return;
      }

      writeDatabase(cloneData(defaultDatabase));
      sendJson(response, 200, { message: "Banco de dados restaurado com sucesso." });
      return;
    }

    if (pathname.startsWith("/api/")) {
      sendNotFound(response);
      return;
    }

    handleStaticFile(request, response);
  } catch (error) {
    sendJson(response, 500, { message: "Erro interno do servidor." });
  }
});

ensureDatabaseFile();

server.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});
