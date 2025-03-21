/**
 * API para gestión de autenticación (simulada)
 * 
 * Este módulo proporciona funciones para simular la autenticación de usuarios
 * en un entorno de prueba.
 */

// Datos de muestra para usuarios
const MOCK_USERS = [
  {
    id: "USR001",
    name: "Maximiliano Tapia",
    email: "mtapia@hopeai.test",
    role: "Psicólogo",
    avatar: "MT"
  },
  {
    id: "USR002",
    name: "María González",
    email: "mgonzalez@hopeai.test",
    role: "Psicóloga",
    avatar: "MG"
  },
  {
    id: "USR003",
    name: "Carlos Mendoza",
    email: "cmendoza@hopeai.test",
    role: "Psicólogo",
    avatar: "CM"
  },
  {
    id: "USR004",
    name: "Ana Vázquez",
    email: "avazquez@hopeai.test",
    role: "Psiquiatra",
    avatar: "AV"
  }
];

// Usuario actual simulado
let currentUser = MOCK_USERS[0];

/**
 * Inicia sesión con credenciales
 * @param {string} email - Correo electrónico
 * @param {string} _ - Contraseña (no se valida en este entorno simulado)
 * @returns {Promise<Object>} - Datos del usuario autenticado
 */
export async function login(email: string, _password: string) {
  return new Promise<{user: typeof MOCK_USERS[0], token: string}>((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === email);
      if (user) {
        currentUser = user;
        resolve({
          user,
          token: "mock-jwt-token-" + Date.now()
        });
      } else {
        reject(new Error("Credenciales incorrectas"));
      }
    }, 800);
  });
}

/**
 * Cierra la sesión actual
 * @returns {Promise<void>}
 */
export async function logout() {
  return new Promise(resolve => {
    setTimeout(() => {
      currentUser = null;
      resolve();
    }, 300);
  });
}

/**
 * Obtiene los datos del usuario actualmente autenticado
 * @returns {Promise<Object>} - Datos del usuario actual
 */
export async function getCurrentUser() {
  return new Promise<typeof MOCK_USERS[0]>((resolve, reject) => {
    setTimeout(() => {
      if (currentUser) {
        resolve(currentUser);
      } else {
        reject(new Error("No hay usuario autenticado"));
      }
    }, 300);
  });
}

/**
 * Comprueba si hay un usuario autenticado
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  return new Promise<boolean>(resolve => {
    setTimeout(() => {
      resolve(!!currentUser);
    }, 100);
  });
} 