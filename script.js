const users = [
  {
    username: "bruce",
    password: "123",
    role: "Funcionario",
    allowedAreas: ["Recepcao", "Escritorio"]
  },
  {
    username: "lucius",
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

let currentUser = null;
let resources = [
  { id: 1, name: "Camera Intelbras", type: "Dispositivo de seguranca", status: "Disponivel" },
  { id: 2, name: "Batmovel de ronda", type: "Veiculo", status: "Em uso" },
  { id: 3, name: "Radio comunicador", type: "Equipamento", status: "Manutencao" }
];

let activities = [
  { user: "alfred", role: "Administrador de seguranca", action: "Atualizou inventario", result: "Sucesso" },
  { user: "lucius", role: "Gerente", action: "Acesso ao Laboratorio", result: "Liberado" },
  { user: "bruce", role: "Funcionario", action: "Acesso a Sala de servidores", result: "Bloqueado" }
];

const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const welcomeTitle = document.getElementById("welcomeTitle");
const roleDescription = document.getElementById("roleDescription");
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

function isEmployee() {
  return currentUser && currentUser.role === "Funcionario";
}

function isManager() {
  return currentUser && currentUser.role === "Gerente";
}

function isSecurityAdmin() {
  return currentUser && currentUser.role === "Administrador de seguranca";
}

function setMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}`;
}

function populateAreas() {
  areaSelect.innerHTML = "";

  areas.forEach((area) => {
    const option = document.createElement("option");
    option.value = area;
    option.textContent = area;
    areaSelect.appendChild(option);
  });
}

function updateDashboard() {
  usersCount.textContent = users.length;
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

function canManageResources() {
  return isManager() || isSecurityAdmin();
}

function canViewActivities() {
  return isManager() || isSecurityAdmin();
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

function applyRolePanels() {
  cardUsers.classList.toggle("hidden", isEmployee());
  cardResources.classList.toggle("hidden", isEmployee());
  cardAllowed.classList.toggle("hidden", false);
  cardBlocked.classList.toggle("hidden", isEmployee());
  resourcePanel.classList.toggle("hidden", !canManageResources());
  activityPanel.classList.toggle("hidden", !canViewActivities());
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
      : `<span>Somente leitura</span>`;

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

function showApp() {
  loginSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  welcomeTitle.textContent = `Bem-vindo, ${currentUser.username}`;
  updateRoleDescription();
  applyRolePanels();
  renderUserInfo();
  populateAreas();
  updateDashboard();
  renderResources();
  renderActivities();
  updateResourcePermissions();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const user = users.find((item) => item.username === username && item.password === password);

  if (!user) {
    setMessage(loginMessage, "Usuario ou senha invalidos.", "error");
    return;
  }

  currentUser = user;
  setMessage(loginMessage, "", "");
  showApp();
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  loginForm.reset();
  resetResourceForm();
  accessResult.textContent = "";
  roleDescription.textContent = "";
  userInfo.innerHTML = "";
  resourceMessage.textContent = "";
  loginSection.classList.remove("hidden");
  appSection.classList.add("hidden");
});

checkAccessButton.addEventListener("click", () => {
  const selectedArea = areaSelect.value;
  const hasAccess = currentUser.allowedAreas.includes(selectedArea);

  if (hasAccess) {
    setMessage(accessResult, `Acesso liberado para ${selectedArea}.`, "success");
    activities.push({
      user: currentUser.username,
      role: currentUser.role,
      action: `Tentou acessar ${selectedArea}`,
      result: "Liberado"
    });
  } else {
    setMessage(accessResult, `Acesso bloqueado para ${selectedArea}.`, "error");
    activities.push({
      user: currentUser.username,
      role: currentUser.role,
      action: `Tentou acessar ${selectedArea}`,
      result: "Bloqueado"
    });
  }

  updateDashboard();
  renderActivities();
});

resourceForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!canManageResources()) {
    setMessage(resourceMessage, "Seu perfil nao tem permissao para alterar recursos.", "error");
    return;
  }

  const id = Number(resourceId.value);
  const resourceData = {
    name: resourceName.value,
    type: resourceType.value,
    status: resourceStatus.value
  };

  if (id) {
    resources = resources.map((item) => item.id === id ? { id, ...resourceData } : item);
    setMessage(resourceMessage, "Recurso atualizado com sucesso.", "success");
    activities.push({
      user: currentUser.username,
      role: currentUser.role,
      action: `Atualizou recurso ${resourceData.name}`,
      result: "Sucesso"
    });
  } else {
    resources.push({
      id: Date.now(),
      ...resourceData
    });
    setMessage(resourceMessage, "Recurso cadastrado com sucesso.", "success");
    activities.push({
      user: currentUser.username,
      role: currentUser.role,
      action: `Cadastrou recurso ${resourceData.name}`,
      result: "Sucesso"
    });
  }

  resetResourceForm();
  updateDashboard();
  renderResources();
  renderActivities();
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

window.deleteResource = function deleteResource(id) {
  if (!canManageResources()) {
    setMessage(resourceMessage, "Seu perfil nao pode remover recursos.", "error");
    return;
  }

  const resource = resources.find((item) => item.id === id);
  resources = resources.filter((item) => item.id !== id);

  setMessage(resourceMessage, "Recurso removido com sucesso.", "success");
  activities.push({
    user: currentUser.username,
    role: currentUser.role,
    action: `Removeu recurso ${resource ? resource.name : id}`,
    result: "Sucesso"
  });

  resetResourceForm();
  updateDashboard();
  renderResources();
  renderActivities();
};
