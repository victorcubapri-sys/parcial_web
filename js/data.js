const STORAGE_KEYS = {
  biblioteca: 'biblioteca.digital.data',
  theme: 'biblioteca.digital.theme',
  usuario: 'biblioteca.digital.usuario',
  sortBy: 'biblioteca.digital.sortBy',
  sortDirection: 'biblioteca.digital.sortDirection',
};

function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function createDemoBooks() {
  return [
    { id: 'libro-1', titulo: 'El principito', autor: 'Antoine de Saint-Exupéry', anio: 1943, genero: 'Novela', coleccion: false, comentario: 'Clásico universal con un mensaje muy humano.' },
    { id: 'libro-2', titulo: 'Don Quijote', autor: 'Miguel de Cervantes', anio: 1605, genero: 'Novela', coleccion: false, comentario: 'Obra maestra de la literatura española.' },
    { id: 'libro-3', titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', anio: 1967, genero: 'Realismo mágico', coleccion: false, comentario: 'Narrativa rica, profunda y visual.' },
    { id: 'libro-4', titulo: 'La Odisea', autor: 'Homero', anio: -800, genero: 'Épica', coleccion: false, comentario: 'Poema épico de viaje y aventura.' },
    { id: 'libro-5', titulo: 'Atlas de literatura', autor: 'Lucía Moreno', anio: 2021, genero: 'Ensayo', coleccion: true, comentario: 'Edición especial de colección.' },
    { id: 'libro-6', titulo: 'Historia del arte', autor: 'Ana Ruiz', anio: 2018, genero: 'Arte', coleccion: false, comentario: 'Recorrido visual del arte contemporáneo.' },
    { id: 'libro-7', titulo: 'Python para principiantes', autor: 'Carlos Vega', anio: 2024, genero: 'Tecnología', coleccion: false, comentario: 'Guía práctica para empezar a programar.' },
    { id: 'libro-8', titulo: 'Bocas del tiempo', autor: 'Marina Solís', anio: 2020, genero: 'Poesía', coleccion: true, comentario: 'Antología en edición limitada.' },
    { id: 'libro-9', titulo: 'La sombra del viento', autor: 'Carlos Ruiz Zafón', anio: 2001, genero: 'Narrativa', coleccion: false, comentario: 'Misterio, memoria y gran ambientación.' },
  ];
}

function createDemoLoans() {
  const today = new Date();
  const books = createDemoBooks();

  return [
    {
      id: 'prestamo-1',
      idLibro: books[0].id,
      persona: 'Ana',
      fechaPrestamo: formatISODate(addDays(today, -5)),
      fechaLimite: formatISODate(addDays(today, 9)),
      fechaDevolucion: null,
    },
    {
      id: 'prestamo-2',
      idLibro: books[2].id,
      persona: 'Luis',
      fechaPrestamo: formatISODate(addDays(today, -20)),
      fechaLimite: formatISODate(addDays(today, -6)),
      fechaDevolucion: null,
    },
    {
      id: 'prestamo-3',
      idLibro: books[1].id,
      persona: 'Marta',
      fechaPrestamo: formatISODate(addDays(today, -10)),
      fechaLimite: formatISODate(addDays(today, 4)),
      fechaDevolucion: null,
    },
    {
      id: 'prestamo-4',
      idLibro: books[5].id,
      persona: 'Elena',
      fechaPrestamo: formatISODate(addDays(today, -30)),
      fechaLimite: formatISODate(addDays(today, -16)),
      fechaDevolucion: formatISODate(addDays(today, -18)),
    },
    {
      id: 'prestamo-5',
      idLibro: books[6].id,
      persona: 'Pablo',
      fechaPrestamo: formatISODate(addDays(today, -18)),
      fechaLimite: formatISODate(addDays(today, -4)),
      fechaDevolucion: formatISODate(addDays(today, -2)),
    },
  ];
}

function safeRead(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

export function createDemoData() {
  const libros = createDemoBooks();
  const prestamos = createDemoLoans();
  const payload = { libros, prestamos };

  safeWrite(STORAGE_KEYS.biblioteca, payload);
  safeWrite(STORAGE_KEYS.theme, 'light');
  safeWrite(STORAGE_KEYS.usuario, 'Victor');
  safeWrite(STORAGE_KEYS.sortBy, 'titulo');
  safeWrite(STORAGE_KEYS.sortDirection, 'asc');

  return payload;
}

export function loadAppState() {
  const stored = safeRead(STORAGE_KEYS.biblioteca);
  const theme = safeRead(STORAGE_KEYS.theme) || 'light';
  const storedUsuario = safeRead(STORAGE_KEYS.usuario);
  const usuario = storedUsuario && storedUsuario !== 'Ana' ? storedUsuario : 'Victor';
  if (storedUsuario === 'Ana') safeWrite(STORAGE_KEYS.usuario, usuario);
  const sortBy = safeRead(STORAGE_KEYS.sortBy) || 'titulo';
  const sortDirection = safeRead(STORAGE_KEYS.sortDirection) || 'asc';

  if (!stored || !Array.isArray(stored.libros) || !Array.isArray(stored.prestamos)) {
    const demo = createDemoData();
    return {
      libros: demo.libros,
      prestamos: demo.prestamos,
      theme,
      usuario,
      sortBy,
      sortDirection,
    };
  }

  return {
    libros: stored.libros,
    prestamos: stored.prestamos,
    theme,
    usuario,
    sortBy,
    sortDirection,
  };
}

export function saveAppData(libros, prestamos) {
  safeWrite(STORAGE_KEYS.biblioteca, { libros, prestamos });
}

export function savePreferences({ theme, usuario, sortBy, sortDirection }) {
  if (theme) safeWrite(STORAGE_KEYS.theme, theme);
  if (usuario !== undefined) safeWrite(STORAGE_KEYS.usuario, usuario);
  if (sortBy) safeWrite(STORAGE_KEYS.sortBy, sortBy);
  if (sortDirection) safeWrite(STORAGE_KEYS.sortDirection, sortDirection);
}

export function resetLibrary() {
  return createDemoData();
}

export function hasStorageAccess() {
  try {
    const key = '__biblioteca_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

export function getStorageKeys() {
  return STORAGE_KEYS;
}
