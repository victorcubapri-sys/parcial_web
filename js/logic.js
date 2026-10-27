export function normalizeString(value) {
  return String(value ?? '').trim();
}

export function getTodayISO() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function addDaysToISO(dateString, quantity) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setDate(date.getDate() + quantity);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getDateFromISO(dateString) {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getActiveLoans(prestamos = []) {
  return prestamos.filter((loan) => loan && loan.fechaDevolucion === null);
}

export function getReturnedLoans(prestamos = []) {
  return prestamos.filter((loan) => loan && loan.fechaDevolucion !== null);
}

export function getLoanByBookId(prestamos, idLibro) {
  return getActiveLoans(prestamos).find((loan) => loan.idLibro === idLibro) || null;
}

export function getBookById(libros, id) {
  return libros.find((book) => book.id === id) || null;
}

export function isLoanOverdue(loan) {
  if (!loan || loan.fechaDevolucion !== null) return false;
  const today = getDateFromISO(getTodayISO());
  const limit = getDateFromISO(loan.fechaLimite);
  if (!today || !limit) return false;
  return today > limit;
}

export function getLoanDelayDays(loan) {
  if (!loan || loan.fechaDevolucion !== null) return 0;
  const limitDate = getDateFromISO(loan.fechaLimite);
  const today = getDateFromISO(getTodayISO());
  if (!limitDate || !today) return 0;
  const diff = Math.ceil((today - limitDate) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function getLoanReturnDelayDays(loan) {
  if (!loan || !loan.fechaDevolucion || !loan.fechaLimite) return 0;
  const limitDate = getDateFromISO(loan.fechaLimite);
  const returnDate = getDateFromISO(loan.fechaDevolucion);
  if (!limitDate || !returnDate) return 0;
  const diff = Math.ceil((returnDate - limitDate) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function isBookAvailable(book, prestamos = []) {
  return !book.coleccion && !getLoanByBookId(prestamos, book.id);
}

export function getBookStatus(book, prestamos = []) {
  if (book.coleccion) return 'coleccion';
  return getLoanByBookId(prestamos, book.id) ? 'prestado' : 'disponible';
}

export function getTotalActiveLoans(prestamos) {
  return getActiveLoans(prestamos).length;
}

export function canCreateNewLoan(book, prestamos) {
  if (!book) {
    return { valid: false, message: 'El libro no existe.' };
  }
  if (book.coleccion) {
    return { valid: false, message: 'Los ejemplares de colección no pueden prestarse.' };
  }
  if (getLoanByBookId(prestamos, book.id)) {
    return { valid: false, message: 'El libro ya está prestado.' };
  }
  if (getTotalActiveLoans(prestamos) >= 3) {
    return { valid: false, message: 'Se alcanzó el límite de 3 préstamos activos.' };
  }
  return { valid: true };
}

export function validateUserName(value) {
  const clean = normalizeString(value);
  if (clean.length < 2 || clean.length > 40) {
    return 'El nombre debe tener entre 2 y 40 caracteres.';
  }
  return '';
}

export function validateBookPayload(data, existingBooks = [], currentId = null) {
  const errors = {};
  const titulo = normalizeString(data.titulo);
  const autor = normalizeString(data.autor);
  const anio = Number(data.anio);
  const genero = normalizeString(data.genero);
  const comentario = normalizeString(data.comentario);

  if (titulo.length < 3 || titulo.length > 60) {
    errors.titulo = 'El título debe tener entre 3 y 60 caracteres.';
  }
  if (!autor) {
    errors.autor = 'El autor es obligatorio.';
  }
  if (!Number.isFinite(anio) || anio < 1000 || anio > 2026) {
    errors.anio = 'El año debe estar entre 1000 y 2026.';
  }
  if (!genero) {
    errors.genero = 'Debes seleccionar un género.';
  }
  if (comentario.length > 120) {
    errors.comentario = 'El comentario no puede superar 120 caracteres.';
  }

  const duplicate = existingBooks.some((book) => {
    if (currentId && book.id === currentId) return false;
    return (
      normalizeString(book.titulo).toLowerCase() === titulo.toLowerCase() &&
      normalizeString(book.autor).toLowerCase() === autor.toLowerCase()
    );
  });

  if (duplicate) {
    errors.titulo = 'Ya existe un libro con el mismo título y autor.';
  }

  return errors;
}

export function normalizeBook(book) {
  return {
    id: String(book.id || `book-${Date.now()}`),
    titulo: normalizeString(book.titulo),
    autor: normalizeString(book.autor),
    anio: Number(book.anio),
    genero: normalizeString(book.genero),
    coleccion: Boolean(book.coleccion),
    comentario: normalizeString(book.comentario),
  };
}

export function createBookLoan(book, persona, prestamos) {
  const check = canCreateNewLoan(book, prestamos);
  if (!check.valid) return { success: false, message: check.message };

  const nameError = validateUserName(persona);
  if (nameError) return { success: false, message: nameError };

  const today = getTodayISO();
  return {
    success: true,
    loan: {
      id: `prestamo-${Date.now()}`,
      idLibro: book.id,
      persona: normalizeString(persona),
      fechaPrestamo: today,
      fechaLimite: addDaysToISO(today, 14),
      fechaDevolucion: null,
    },
  };
}

export function returnLoanBook(loan) {
  if (!loan || loan.fechaDevolucion !== null) {
    return { success: false, message: 'El préstamo ya está devuelto.' };
  }

  const returnDate = getDateFromISO(getTodayISO());
  const limitDate = getDateFromISO(loan.fechaLimite);
  const delayDays = limitDate && returnDate > limitDate ? Math.ceil((returnDate - limitDate) / (1000 * 60 * 60 * 24)) : 0;

  return {
    success: true,
    date: getTodayISO(),
    delayDays,
  };
}

export function getFilteredBooks(libros, prestamos, filters = {}) {
  const query = normalizeString(filters.query).toLowerCase();
  const status = filters.status || 'todos';
  const genre = filters.genre || 'todos';

  return libros.filter((book) => {
    const titleMatch = normalizeString(book.titulo).toLowerCase().includes(query);
    const authorMatch = normalizeString(book.autor).toLowerCase().includes(query);
    const queryMatch = !query || titleMatch || authorMatch;

    const statusMatch =
      status === 'todos' ||
      (status === 'disponibles' && isBookAvailable(book, prestamos)) ||
      (status === 'prestados' && Boolean(getLoanByBookId(prestamos, book.id)));

    const genreMatch = genre === 'todos' || book.genero === genre;

    return queryMatch && statusMatch && genreMatch;
  });
}

export function sortBooks(libros, sortBy = 'titulo', direction = 'asc') {
  const factor = direction === 'desc' ? -1 : 1;
  const copied = [...libros];

  copied.sort((left, right) => {
    if (sortBy === 'anio') {
      return (Number(left.anio) - Number(right.anio)) * factor;
    }

    const leftValue = String(left[sortBy] ?? '').toLocaleLowerCase('es-ES');
    const rightValue = String(right[sortBy] ?? '').toLocaleLowerCase('es-ES');
    return leftValue.localeCompare(rightValue, 'es-ES', { sensitivity: 'base' }) * factor;
  });

  return copied;
}

export function getGenreSummary(libros) {
  const counts = {};
  libros.forEach((book) => {
    const key = book.genero || 'Sin género';
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts).sort((left, right) => right[1] - left[1]);
}

export function getSummaryStats(libros, prestamos) {
  const total = libros.length;
  const available = libros.filter((book) => isBookAvailable(book, prestamos)).length;
  const borrowed = total - available;
  const overdue = getActiveLoans(prestamos).filter((loan) => isLoanOverdue(loan)).length;

  return {
    total,
    available,
    borrowed,
    overdue,
    genres: getGenreSummary(libros),
  };
}

export function deleteBookWithHistory(libros, prestamos, idLibro) {
  const book = getBookById(libros, idLibro);
  if (!book) return { success: false, message: 'El libro no existe.' };
  if (getLoanByBookId(prestamos, idLibro)) {
    return { success: false, message: 'No se puede eliminar un libro con préstamo activo.' };
  }

  return {
    success: true,
    books: libros.filter((item) => item.id !== idLibro),
    prestamos: prestamos.filter((item) => item.idLibro !== idLibro),
  };
}

export function canEditCollectionToggle(book, prestamos) {
  return !book || !getLoanByBookId(prestamos, book.id);
}

export function ensureCollectionNotWithActiveLoan(book, prestamos) {
  if (book && book.coleccion && getLoanByBookId(prestamos, book.id)) {
    return { valid: false, message: 'No puedes marcar como colección un libro con préstamo activo.' };
  }
  return { valid: true };
}

export function getGenreOptions() {
  return [
    'Novela',
    'Poesía',
    'Ciencia ficción',
    'Ensayo',
    'Arte',
    'Tecnología',
    'Narrativa',
    'Realismo mágico',
    'Épica',
    'Historia',
    'Biografía',
    'Drama',
    'Fantasía',
  ];
}
