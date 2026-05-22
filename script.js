const SESSION_KEY = "wayne_current_user";

const appConfig = {
  areas: [],
  totalUsers: 0
};

let currentUser = null;
let resources = [];
let activities = [];

const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const welcomeTitle = document.getElementById("welcomeTitle");
const roleDescription = document.getElementById("roleDescription");
const databaseInfo = document.getElementById("databaseInfo");
const userInfo = document.getElementById("userInfo");
const logoutButton = document.getElementById("logoutButton");
const areaSelect = document.getElementById("areaSelect");
const checkAccessButton = document.getElementById("checkAccessButton");
const accessResult = document.getElementById("accessResult");
const usersCount = document.getElementById("usersCount");
const resourcesCount = document.getElementById("resourcesCount");
const allowedCount = document.getElementById("allowedCount");
const blockedCount = document.getElementById("blockedCount");
const resourceForm = document.getElementById("resourceForm");
const resourceId = document.getElementById("resourceId");
const resourceName = document.getElementById("resourceName");
const resourceType = document.getElementById("resourceType");
const resourceStatus = document.getElementById("resourceStatus");
const cancelEditButton = document.getElementById("cancelEditButton");
const resourceMessage = document.getElementById("resourceMessage");
const resourceTableBody = document.getElementById("resourceTableBody");
const activityTableBody = document.getElementById("activityTableBody");
const cardUsers = document.getElementById("cardUsers");
const cardResources = document.getElementById("cardResources");
const cardAllowed = document.getElementById("cardAllowed");
const cardBlocked = document.getElementById("cardBlocked");
const resourcePanel = document.getElementById("resourcePanel");
const activityPanel = document.getElementById("activityPanel");
const resetDatabaseButton = document.getElementById("resetDatabaseButton");

function isEmployee() {
  return currentUser && currentUser.role === "Funcionario";
}

function isManager() {
  return currentUser && currentUser.role === "Gerente";
}

function isSecurityAdmin() {
  return currentUser && currentUser.role === "Administrador de seguranca";
}

function canManageResources() {
  return isManager() || isSecurityAdmin();
}

function canViewActivities() {
  return isManager() || isSecurityAdmin();
}

function setMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao acessar o servidor.");
  }

  return data;
}

function saveSession() {
  if (!currentUser) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
}

function loadSession() {
  const savedUser = localStorage.getItem(SESSION_KEY);

  if (!savedUser) {
    return;
  }

  currentUser = JSON.parse(savedUser);
}

async function loadConfig() {
  const data = await apiRequest("/api/config");
  appConfig.areas = data.areas;
  appConfig.totalUsers = data.totalUsers;
}

async function loadData() {
  const [resourceData, activityData] = await Promise.all([
    apiRequest("/api/resources"),
    apiRequest("/api/activities")
  ]);

  resources = resourceData.resources;
  activities = activityData.activities;
}

function populateAreas() {
  areaSelect.innerHTML = "";

  appConfig.areas.forEach((area) => {
    const option = document.createElement("option");
    option.value = area;
    option.textContent = area;
    areaSelect.appendChild(option);
  });
}

function updateDashboard() {
  usersCount.textContent = appConfig.totalUsers;
  resourcesCount.textContent = resources.length;
  allowedCount.textContent = activities.filter((item) => item.result === "Liberado" || item.result === "Sucesso").length;
  blockedCount.textContent = activities.filter((item) => item.result === "Bloqueado").length;
}

function renderUserInfo() {
  userInfo.innerHTML = `
    <p><strong>Usuario:</strong> ${currentUser.username}</p>
    <p><strong>Perfil:</strong> ${currentUser.role}</p>
    <p><strong>Areas permitidas:</strong> ${currentUser.allowedAreas.join(", ")}</p>
  `;
}

function updateRoleDescription() {
  if (isEmployee()) {
    roleDescription.textContent = "Perfil basico: acesso apenas ao controle de entrada e aos seus dados.";
    return;
  }

  if (isManager()) {
    roleDescription.textContent = "Perfil de gerente: acesso ao painel de recursos e ao historico de atividades.";
    return;
  }

  roleDescription.textContent = "Perfil de administrador: acesso total aos paineis de seguranca e gestao.";
}

function updateDatabaseInfo() {
  databaseInfo.textContent = "Backend local ativo: os dados agora sao salvos em um arquivo simples no servidor.";
}

function applyRolePanels() {
  cardUsers.classList.toggle("hidden", isEmployee());
  cardResources.classList.toggle("hidden", isEmployee());
  cardAllowed.classList.toggle("hidden", false);
  cardBlocked.classList.toggle("hidden", isEmployee());
  resourcePanel.classList.toggle("hidden", !canManageResources());
  activityPanel.classList.toggle("hidden", !canViewActivities());
  resetDatabaseButton.classList.toggle("hidden", !canManageResources());
}

function renderResources() {
  resourceTableBody.innerHTML = "";

  resources.forEach((resource) => {
    const row = document.createElement("tr");

    const actions = canManageResources()
      ? `
        <button onclick="editResource(${resource.id})">Editar</button>
        <button class="secondary-button" onclick="deleteResource(${resource.id})">Remover</button>
      `
      : "<span>Somente leitura</span>";

    row.innerHTML = `
      <td>${resource.name}</td>
      <td>${resource.type}</td>
      <td>${resource.status}</td>
      <td>${actions}</td>
    `;

    resourceTableBody.appendChild(row);
  });
}

function renderActivities() {
  activityTableBody.innerHTML = "";

  activities.slice().reverse().forEach((activity) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${activity.user}</td>
      <td>${activity.role}</td>
      <td>${activity.action}</td>
      <td>${activity.result}</td>
    `;
    activityTableBody.appendChild(row);
  });
}

function resetResourceForm() {
  resourceId.value = "";
  resourceName.value = "";
  resourceType.value = "Equipamento";
  resourceStatus.value = "Disponivel";
}

function updateResourcePermissions() {
  const disabled = !canManageResources();

  resourceName.disabled = disabled;
  resourceType.disabled = disabled;
  resourceStatus.disabled = disabled;
  document.getElementById("saveResourceButton").disabled = disabled;
  cancelEditButton.disabled = disabled;

  if (disabled) {
    setMessage(resourceMessage, "Seu perfil pode apenas visualizar os recursos.", "warning");
  } else {
    setMessage(resourceMessage, "Voce pode cadastrar e atualizar recursos.", "success");
  }
}

async function showApp() {
  await loadData();
  loginSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  welcomeTitle.textContent = `Bem-vindo, ${currentUser.username}`;
  updateRoleDescription();
  updateDatabaseInfo();
  applyRolePanels();
  renderUserInfo();
  populateAreas();
  updateDashboard();
  renderResources();
  renderActivities();
  updateResourcePermissions();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const data = await apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    currentUser = data.user;
    saveSession();
    setMessage(loginMessage, "", "");
    await showApp();
  } catch (error) {
    setMessage(loginMessage, error.message, "error");
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  saveSession();
  loginForm.reset();
  resetResourceForm();
  accessResult.textContent = "";
  roleDescription.textContent = "";
  databaseInfo.textContent = "";
  userInfo.innerHTML = "";
  resourceMessage.textContent = "";
  loginSection.classList.remove("hidden");
  appSection.classList.add("hidden");
});

checkAccessButton.addEventListener("click", async () => {
  try {
    const selectedArea = areaSelect.value;
    const data = await apiRequest("/api/access-check", {
      method: "POST",
      body: JSON.stringify({
        username: currentUser.username,
        area: selectedArea
      })
    });

    setMessage(accessResult, data.message, data.allowed ? "success" : "error");
    await loadData();
    updateDashboard();
    renderActivities();
  } catch (error) {
    setMessage(accessResult, error.message, "error");
  }
});

resourceForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!canManageResources()) {
    setMessage(resourceMessage, "Seu perfil nao tem permissao para alterar recursos.", "error");
    return;
  }

  try {
    const id = Number(resourceId.value);
    const payload = {
      actor: currentUser.username,
      name: resourceName.value,
      type: resourceType.value,
      status: resourceStatus.value
    };

    if (id) {
      await apiRequest(`/api/resources/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setMessage(resourceMessage, "Recurso atualizado com sucesso.", "success");
    } else {
      await apiRequest("/api/resources", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setMessage(resourceMessage, "Recurso cadastrado com sucesso.", "success");
    }

    await loadData();
    resetResourceForm();
    updateDashboard();
    renderResources();
    renderActivities();
  } catch (error) {
    setMessage(resourceMessage, error.message, "error");
  }
});

cancelEditButton.addEventListener("click", () => {
  resetResourceForm();
  setMessage(resourceMessage, "Edicao cancelada.", "warning");
});

window.editResource = function editResource(id) {
  if (!canManageResources()) {
    setMessage(resourceMessage, "Seu perfil nao pode editar recursos.", "error");
    return;
  }

  const resource = resources.find((item) => item.id === id);

  if (!resource) {
    return;
  }

  resourceId.value = resource.id;
  resourceName.value = resource.name;
  resourceType.value = resource.type;
  resourceStatus.value = resource.status;
  setMessage(resourceMessage, "Editando recurso selecionado.", "warning");
};

window.deleteResource = async function deleteResource(id) {
  if (!canManageResources()) {
    setMessage(resourceMessage, "Seu perfil nao pode remover recursos.", "error");
    return;
  }

  try {
    await apiRequest(`/api/resources/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ actor: currentUser.username })
    });

    setMessage(resourceMessage, "Recurso removido com sucesso.", "success");
    await loadData();
    resetResourceForm();
    updateDashboard();
    renderResources();
    renderActivities();
  } catch (error) {
    setMessage(resourceMessage, error.message, "error");
  }
};

resetDatabaseButton.addEventListener("click", async () => {
  if (!canManageResources()) {
    return;
  }

  try {
    await apiRequest("/api/reset", {
      method: "POST",
      body: JSON.stringify({ actor: currentUser.username })
    });

    await loadData();
    setMessage(resourceMessage, "Banco de dados restaurado com os dados iniciais.", "success");
    updateDashboard();
    renderResources();
    renderActivities();
  } catch (error) {
    setMessage(resourceMessage, error.message, "error");
  }
});

async function initializeApp() {
  try {
    await loadConfig();
    loadSession();

    if (currentUser) {
      await showApp();
    }
  } catch (error) {
    setMessage(loginMessage, "Nao foi possivel iniciar o sistema.", "error");
  }
}

initializeApp();
