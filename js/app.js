import {
  createDemoData,
  hasStorageAccess,
  loadAppState,
  resetLibrary,
  saveAppData,
  savePreferences,
} from './data.js';

import {
  addDaysToISO,
  canCreateNewLoan,
  canEditCollectionToggle,
  createBookLoan,
  deleteBookWithHistory,
  ensureCollectionNotWithActiveLoan,
  getActiveLoans,
  getBookById,
  getFilteredBooks,
  getGenreOptions,
  getLoanByBookId,
  getSummaryStats,
  getTotalActiveLoans,
  isBookAvailable,
  isLoanOverdue,
  normalizeBook,
  returnLoanBook,
  sortBooks,
  validateBookPayload,
  validateUserName,
} from './logic.js';

import {
  clearFormErrors,
  closeModal,
  fillBookForm,
  renderCatalog,
  renderGenreOptions,
  renderLoansView,
  renderSummaryStats,
  setPageTitle,
  setThemeButtonLabel,
  setUserGreeting,
  showFieldErrors,
  showModal,
  showToast,
  showView,
  syncNavButtons,
  updateCommentCounter,
  updateLoansMenuLabel,
  updateUserNameInput,
} from './ui.js';

const state = {
  currentView: 'catalog',
  libros: [],
  prestamos: [],
  theme: 'light',
  usuario: 'Victor',
  sortBy: 'titulo',
  sortDirection: 'asc',
  filters: {
    query: '',
    status: 'todos',
    genre: 'todos',
  },
  editingBookId: null,
};

function persistState() {
  saveAppData(state.libros, state.prestamos);
  savePreferences({
    theme: state.theme,
    usuario: state.usuario,
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
  });
}

function setTheme(isDark) {
  state.theme = isDark ? 'dark' : 'light';
  document.body.classList.toggle('dark', isDark);
  setThemeButtonLabel(isDark);
  persistState();
}

function setView(viewName) {
  state.currentView = viewName;
  const map = {
    catalog: 'Catálogo',
    loans: 'Mis préstamos',
    form: 'Agregar libro',
    summary: 'Resumen',
  };

  setPageTitle(map[viewName] || 'Biblioteca');
  showView(viewName);
  syncNavButtons(viewName);
}

function renderFiltersLists() {
  const genreFilter = document.getElementById('genre-filter');
  const currentGenres = ['todos', ...new Set(state.libros.map((book) => book.genero))];
  genreFilter.innerHTML = '<option value="todos">Todos</option>';

  currentGenres.filter((genre) => genre && genre !== 'todos').forEach((genre) => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    if (state.filters.genre === genre) option.selected = true;
    genreFilter.appendChild(option);
  });

  genreFilter.value = state.filters.genre;
}

function renderAll() {
  renderFiltersLists();
  renderCatalog(state.libros, state.prestamos, {
    ...state.filters,
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
  }, {
    getFilteredBooks,
    sortBooks,
    activeLoansCount: getTotalActiveLoans(state.prestamos),
  });

  renderLoansView(state.prestamos, state.libros);
  renderSummaryStats(getSummaryStats(state.libros, state.prestamos));
  updateLoansMenuLabel(getTotalActiveLoans(state.prestamos));
  setUserGreeting(state.usuario);
  updateUserNameInput(state.usuario);
  setThemeButtonLabel(state.theme === 'dark');
  document.body.classList.toggle('dark', state.theme === 'dark');
  document.getElementById('sort-field').value = state.sortBy;
  document.getElementById('sort-direction').value = state.sortDirection;
  document.getElementById('status-filter').value = state.filters.status;
  document.getElementById('catalog-search').value = state.filters.query;

  if (state.editingBookId) {
    const book = state.libros.find((item) => item.id === state.editingBookId) || null;
    if (book) {
      fillBookForm(book, true);
    }
  } else {
    fillBookForm(null, false);
  }
}

function openLoanModal(bookId) {
  const book = state.libros.find((item) => item.id === bookId);
  if (!book) {
    showToast('Libro no encontrado.');
    return;
  }

  const validation = canCreateNewLoan(book, state.prestamos);
  if (!validation.valid) {
    showToast(validation.message);
    return;
  }

  showModal({
    title: 'Prestar libro',
    bodyText: `Introduce el nombre de la persona que prestará «${book.titulo}».`,
    type: 'loan',
    defaultValue: state.usuario,
    confirmText: 'Guardar préstamo',
    cancelText: 'Cancelar',
    onConfirm: (persona) => {
      const error = validateUserName(persona);
      if (error) {
        return { error };
      }
      const result = createBookLoan(book, persona, state.prestamos);
      if (!result.success) {
        return { error: result.message };
      }
      state.prestamos.push(result.loan);
      persistState();
      showToast('Préstamo registrado correctamente.');
      renderAll();
      return null;
    },
  });
}

function openDeleteModal(bookId) {
  const book = state.libros.find((item) => item.id === bookId);
  if (!book) {
    showToast('El libro no existe.');
    return;
  }

  if (getLoanByBookId(state.prestamos, bookId)) {
    showToast('No se puede eliminar un libro con préstamo activo.');
    return;
  }

  showModal({
    title: 'Confirmar eliminación',
    bodyText: `¿Deseas eliminar el libro «${book.titulo}»? También se borrará su historial de préstamos.`,
    type: 'danger',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    onConfirm: () => {
      const result = deleteBookWithHistory(state.libros, state.prestamos, bookId);
      if (!result.success) {
        showToast(result.message);
        return;
      }
      state.libros = result.books;
      state.prestamos = result.prestamos;
      persistState();
      showToast('Libro eliminado correctamente.');
      renderAll();
      return null;
    },
  });
}

function openResetModal() {
  showModal({
    title: 'Restablecer biblioteca',
    bodyText: 'Se perderán los cambios actuales y se restaurará el contenido inicial de demostración.',
    type: 'danger',
    confirmText: 'Restablecer',
    cancelText: 'Cancelar',
    onConfirm: () => {
      const fresh = resetLibrary();
      state.libros = fresh.libros;
      state.prestamos = fresh.prestamos;
      state.usuario = 'Victor';
      state.sortBy = 'titulo';
      state.sortDirection = 'asc';
      state.filters = { query: '', status: 'todos', genre: 'todos' };
      state.editingBookId = null;
      persistState();
      showToast('Biblioteca restablecida.');
      renderAll();
      return null;
    },
  });
}

function handleBookSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = {
    titulo: formData.get('titulo'),
    autor: formData.get('autor'),
    anio: formData.get('anio'),
    genero: formData.get('genero'),
    comentario: formData.get('comentario'),
    coleccion: formData.get('coleccion') === 'on',
  };

  const errors = validateBookPayload(payload, state.libros, state.editingBookId);
  const currentBook = state.editingBookId ? state.libros.find((book) => book.id === state.editingBookId) : null;
  if (payload.coleccion && currentBook && getLoanByBookId(state.prestamos, currentBook.id)) {
    errors.coleccion = 'No puedes convertir en colección un libro con préstamo activo.';
  }

  clearFormErrors();
  if (Object.keys(errors).length > 0) {
    showFieldErrors(errors);
    const firstInvalid = form.querySelector('input[name="titulo"], input[name="autor"], input[name="anio"], select[name="genero"], textarea[name="comentario"]');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const normalized = normalizeBook({
    ...payload,
    id: state.editingBookId || `book-${Date.now()}`,
  });

  if (state.editingBookId) {
    state.libros = state.libros.map((book) => (book.id === state.editingBookId ? normalized : book));
    showToast('Libro actualizado correctamente.');
  } else {
    state.libros.push(normalized);
    showToast('Libro agregado correctamente.');
  }

  state.editingBookId = null;
  form.reset();
  updateCommentCounter('');
  persistState();
  renderAll();
  setView('catalog');
}

function cancelEdit() {
  state.editingBookId = null;
  document.getElementById('book-form').reset();
  clearFormErrors();
  updateCommentCounter('');
  renderAll();
  setView('catalog');
}

function attachEvents() {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.view;
      if (target === 'form') {
        state.editingBookId = null;
        document.getElementById('book-form').reset();
        clearFormErrors();
        updateCommentCounter('');
      }
      setView(target);
      if (target === 'catalog') renderAll();
    });
  });

  document.getElementById('catalog-search').addEventListener('input', (event) => {
    state.filters.query = event.target.value;
    renderAll();
  });

  document.getElementById('status-filter').addEventListener('change', (event) => {
    state.filters.status = event.target.value;
    renderAll();
  });

  document.getElementById('genre-filter').addEventListener('change', (event) => {
    state.filters.genre = event.target.value;
    renderAll();
  });

  document.getElementById('sort-field').addEventListener('change', (event) => {
    state.sortBy = event.target.value;
    persistState();
    renderAll();
  });

  document.getElementById('sort-direction').addEventListener('change', (event) => {
    state.sortDirection = event.target.value;
    persistState();
    renderAll();
  });

  document.getElementById('book-form').addEventListener('submit', handleBookSubmit);
  document.getElementById('cancel-edit').addEventListener('click', cancelEdit);
  document.getElementById('book-comment').addEventListener('input', (event) => updateCommentCounter(event.target.value));
  document.getElementById('theme-toggle').addEventListener('click', () => setTheme(state.theme !== 'dark'));

  document.getElementById('user-name-input').addEventListener('input', (event) => {
    const name = event.target.value.trim() || 'Victor';
    state.usuario = name;
    setUserGreeting(name);
    persistState();
  });

  document.getElementById('reset-library').addEventListener('click', openResetModal);

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;

    const { action, id } = trigger.dataset;

    if (action === 'loan') openLoanModal(id);
    if (action === 'edit') {
      state.editingBookId = id;
      renderAll();
      setView('form');
    }
    if (action === 'delete') openDeleteModal(id);
    if (action === 'return') {
      const loan = state.prestamos.find((item) => item.idLibro === id && item.fechaDevolucion === null);
      if (!loan) {
        showToast('Este libro no tiene un préstamo activo.');
        return;
      }
      const result = returnLoanBook(loan);
      if (!result.success) {
        showToast(result.message);
        return;
      }
      state.prestamos = state.prestamos.map((item) => item.id === loan.id ? { ...item, fechaDevolucion: result.date } : item);
      persistState();
      showToast(result.delayDays > 0 ? `Devolución con ${result.delayDays} días de retraso.` : 'Devolución puntual registrada.');
      renderAll();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (document.getElementById('modal-root').children.length > 0) {
      closeModal();
      return;
    }

    const form = document.getElementById('book-form');
    const hasFormData =
      form.elements.titulo.value ||
      form.elements.autor.value ||
      form.elements.anio.value ||
      form.elements.genero.value ||
      form.elements.comentario.value ||
      form.elements.coleccion.checked;

    if (hasFormData || state.editingBookId) {
      cancelEdit();
    }
  });
}

function boot() {
  if (!hasStorageAccess()) {
    showToast('El almacenamiento local no está disponible en este navegador.');
  }

  const loaded = loadAppState();
  state.libros = loaded.libros;
  state.prestamos = loaded.prestamos;
  state.theme = loaded.theme || 'light';
  state.usuario = loaded.usuario || 'Victor';
  state.sortBy = loaded.sortBy || 'titulo';
  state.sortDirection = loaded.sortDirection || 'asc';

  renderGenreOptions();
  attachEvents();
  renderAll();
  setView('catalog');
}

boot();
