function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textContent !== undefined && textContent !== null) element.textContent = textContent;
  return element;
}

function createTag(label, variant) {
  const tag = createElement('span', `tag ${variant}`);
  tag.textContent = label;
  return tag;
}

function createEmptyState(message) {
  const box = createElement('div', 'empty-state', message);
  return box;
}

function getStatusLabel(book, prestamos) {
  if (book.coleccion) return 'Colección';
  return getLoanForBook(prestamos, book.id) ? 'Prestado' : 'Disponible';
}

function getLoanForBook(prestamos, idLibro) {
  return prestamos.find((loan) => loan.idLibro === idLibro && loan.fechaDevolucion === null) || null;
}

function isBookOverdue(book, prestamos) {
  const loan = getLoanForBook(prestamos, book.id);
  if (!loan) return false;
  const limit = new Date(`${loan.fechaLimite}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > limit;
}

function getDelayDays(loan) {
  if (!loan || !loan.fechaLimite) return 0;
  const limit = new Date(`${loan.fechaLimite}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((today - limit) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function renderCatalog(libros, prestamos, filters, sorter) {
  const grid = document.getElementById('catalog-grid');
  const counter = document.getElementById('catalog-counter');
  grid.innerHTML = '';

  const filtered = sorter.getFilteredBooks(libros, prestamos, filters);
  const sorted = sorter.sortBooks(filtered, filters.sortBy, filters.sortDirection);

  sorted.forEach((book) => {
    const card = createElement('article', 'book-card');
    const loan = getLoanForBook(prestamos, book.id);

    const header = createElement('div', 'book-header');
    const title = createElement('h3');
    title.textContent = book.titulo;
    const status = createElement('span', `tag ${book.coleccion ? 'collection' : loan ? 'borrowed' : 'available'}`);
    status.textContent = getStatusLabel(book, prestamos);
    header.appendChild(title);
    header.appendChild(status);
    card.appendChild(header);

    const meta = createElement('p', 'book-meta');
    meta.textContent = `${book.autor} · ${book.anio}`;
    card.appendChild(meta);

    const tagRow = createElement('div', 'book-tag-row');
    if (book.coleccion) tagRow.appendChild(createTag('Colección', 'collection'));
    if (loan && isBookOverdue(book, prestamos)) tagRow.appendChild(createTag('Vencido', 'overdue'));
    if (tagRow.childElementCount > 0) card.appendChild(tagRow);

    const infoList = createElement('ul', 'book-info-list');
    const genreRow = createElement('li');
    genreRow.textContent = `Género: ${book.genero}`;
    const borrowerRow = createElement('li');
    borrowerRow.textContent = `Prestado a: ${loan ? loan.persona : '—'}`;
    const limitRow = createElement('li');
    limitRow.textContent = `Fecha límite: ${loan ? loan.fechaLimite : '—'}`;

    infoList.appendChild(genreRow);
    infoList.appendChild(borrowerRow);
    infoList.appendChild(limitRow);
    if (loan && isBookOverdue(book, prestamos)) {
      const delayRow = createElement('li');
      delayRow.textContent = `Retraso: ${getDelayDays(loan)} días`;
      infoList.appendChild(delayRow);
    }
    card.appendChild(infoList);

    const actions = createElement('div', 'card-actions');
    const loanBtn = createElement('button', 'primary-btn', 'Prestar');
    loanBtn.type = 'button';
    loanBtn.dataset.action = 'loan';
    loanBtn.dataset.id = book.id;
    loanBtn.disabled = Boolean(book.coleccion) || Boolean(loan) || sorter.activeLoansCount >= 3;
    actions.appendChild(loanBtn);

    const returnBtn = createElement('button', 'secondary-btn', 'Devolver');
    returnBtn.type = 'button';
    returnBtn.dataset.action = 'return';
    returnBtn.dataset.id = book.id;
    returnBtn.disabled = !loan;
    actions.appendChild(returnBtn);

    const editBtn = createElement('button', 'ghost-btn', 'Editar');
    editBtn.type = 'button';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = book.id;
    actions.appendChild(editBtn);

    const deleteBtn = createElement('button', 'danger-btn', 'Eliminar');
    deleteBtn.type = 'button';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.id = book.id;
    deleteBtn.disabled = Boolean(loan);
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    grid.appendChild(card);
  });

  counter.textContent = `Mostrando ${sorted.length} de ${libros.length} libros`;

  if (sorted.length === 0) {
    grid.appendChild(createEmptyState('No se encontraron libros con estos filtros.'));
  }
}

export function renderLoansView(prestamos, libros) {
  const activeList = document.getElementById('active-loans-list');
  const historyList = document.getElementById('history-loans-list');
  activeList.innerHTML = '';
  historyList.innerHTML = '';

  const active = [...prestamos]
    .filter((loan) => loan.fechaDevolucion === null)
    .sort((left, right) => new Date(`${left.fechaLimite}T00:00:00`) - new Date(`${right.fechaLimite}T00:00:00`));

  const history = [...prestamos]
    .filter((loan) => loan.fechaDevolucion !== null)
    .sort((left, right) => new Date(`${right.fechaDevolucion}T00:00:00`) - new Date(`${left.fechaDevolucion}T00:00:00`));

  if (active.length === 0) {
    activeList.appendChild(createEmptyState('No hay préstamos activos.'));
  } else {
    active.forEach((loan) => {
      const book = libros.find((item) => item.id === loan.idLibro);
      activeList.appendChild(createLoanCard(loan, book, true));
    });
  }

  if (history.length === 0) {
    historyList.appendChild(createEmptyState('Todavía no hay historial de préstamos.'));
  } else {
    history.forEach((loan) => {
      const book = libros.find((item) => item.id === loan.idLibro);
      historyList.appendChild(createLoanCard(loan, book, false));
    });
  }
}

function createLoanCard(loan, book, isActive) {
  const item = createElement('div', `loan-item ${isActive && isLoanExpired(loan) ? 'expired' : ''}`);
  const header = createElement('div', 'loan-header');
  const title = createElement('h4');
  title.textContent = book ? book.titulo : 'Libro eliminado';
  header.appendChild(title);

  if (isActive && isLoanExpired(loan)) {
    header.appendChild(createTag('Vencido', 'overdue'));
  }

  item.appendChild(header);

  const content = createElement('div', 'loan-content');
  const lines = [
    `Persona: ${loan.persona}`,
    `Préstamo: ${loan.fechaPrestamo}`,
    `Límite: ${loan.fechaLimite}`,
  ];

  if (isActive) {
    const delay = getLoanDelayForDisplay(loan);
    lines.push(`Retraso: ${delay} días`);
  } else {
    const delay = getReturnDelay(loan);
    lines.push(delay > 0 ? `Devolución tardía: ${delay} días de retraso` : 'Devolución puntual');
    lines.push(`Devolución: ${loan.fechaDevolucion}`);
  }

  lines.forEach((line) => {
    const row = createElement('p');
    row.textContent = line;
    content.appendChild(row);
  });

  item.appendChild(content);

  if (isActive) {
    const button = createElement('button', 'primary-btn', 'Devolver');
    button.type = 'button';
    button.dataset.action = 'return';
    button.dataset.id = loan.idLibro;
    item.appendChild(button);
  }

  return item;
}

function isLoanExpired(loan) {
  if (!loan || loan.fechaDevolucion !== null) return false;
  if (!loan.fechaLimite) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(`${loan.fechaLimite}T00:00:00`);
  return today > limit;
}

function getLoanDelayForDisplay(loan) {
  if (!loan || !loan.fechaLimite) return 0;
  const limit = new Date(`${loan.fechaLimite}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((today - limit) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function getReturnDelay(loan) {
  if (!loan || !loan.fechaDevolucion || !loan.fechaLimite) return 0;
  const limit = new Date(`${loan.fechaLimite}T00:00:00`);
  const returnDate = new Date(`${loan.fechaDevolucion}T00:00:00`);
  const diff = Math.ceil((returnDate - limit) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function renderSummaryStats(stats) {
  document.getElementById('stat-total').textContent = String(stats.total);
  document.getElementById('stat-available').textContent = String(stats.available);
  document.getElementById('stat-borrowed').textContent = String(stats.borrowed);
  document.getElementById('stat-overdue').textContent = String(stats.overdue);

  const list = document.getElementById('genre-summary');
  list.innerHTML = '';

  if (!stats.genres || stats.genres.length === 0) {
    const empty = createEmptyState('Todavía no hay datos por género.');
    list.appendChild(empty);
    return;
  }

  stats.genres.forEach(([genre, count]) => {
    const item = createElement('li', 'genre-summary-item');
    const name = createElement('span');
    name.textContent = genre;
    const value = createElement('strong');
    value.textContent = String(count);
    item.appendChild(name);
    item.appendChild(value);
    list.appendChild(item);
  });
}

export function renderGenreOptions(selectedValue = '') {
  const select = document.getElementById('book-genre');
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona un género';
  select.appendChild(placeholder);

  const options = [
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

  options.forEach((genre) => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    if (genre === selectedValue) option.selected = true;
    select.appendChild(option);
  });
}

export function showView(viewName) {
  const views = document.querySelectorAll('.view');
  views.forEach((view) => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });
}

export function setPageTitle(text) {
  const title = document.getElementById('page-title');
  title.textContent = text;
}

export function syncNavButtons(selectedView) {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === selectedView);
  });
}

export function fillBookForm(book, isEdit) {
  const form = document.getElementById('book-form');
  form.elements.titulo.value = book ? book.titulo : '';
  form.elements.autor.value = book ? book.autor : '';
  form.elements.anio.value = book ? book.anio : '';
  form.elements.genero.value = book ? book.genero : '';
  form.elements.comentario.value = book ? book.comentario : '';
  form.elements.coleccion.checked = book ? Boolean(book.coleccion) : false;

  document.getElementById('submit-book').textContent = isEdit ? 'Guardar cambios' : 'Guardar libro';
  document.getElementById('cancel-edit').classList.toggle('hidden', !isEdit);
  document.getElementById('form-title').textContent = isEdit ? 'Editar libro' : 'Agregar libro';
  updateCommentCounter(form.elements.comentario.value || '');
}

export function clearFormErrors() {
  document.querySelectorAll('.field-error').forEach((node) => {
    node.textContent = '';
  });
}

export function showFieldErrors(errors) {
  Object.entries(errors).forEach(([key, value]) => {
    const node = document.querySelector(`[data-error-for="${key}"]`);
    if (node) node.textContent = value;
  });
}

export function updateCommentCounter(value) {
  const counter = document.getElementById('comment-counter');
  const remaining = 120 - String(value || '').length;
  counter.textContent = `${remaining} caracteres restantes`;
}

export function setUserGreeting(name) {
  document.getElementById('user-greeting').textContent = `Hola, ${name}`;
}

export function updateUserNameInput(value) {
  document.getElementById('user-name-input').value = value;
}

export function setThemeButtonLabel(isDark) {
  document.getElementById('theme-toggle').textContent = isDark ? 'Tema claro' : 'Tema oscuro';
}

export function updateLoansMenuLabel(count) {
  document.getElementById('loans-menu-label').textContent = `Mis préstamos (${count})`;
}

export function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timerId);
  showToast.timerId = setTimeout(() => {
    toast.classList.remove('visible');
  }, 2200);
}

export function showModal({ title, bodyText, type = 'confirm', confirmText = 'Aceptar', cancelText = 'Cancelar', defaultValue = '', onConfirm, onCancel }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';

  const header = document.createElement('h3');
  header.textContent = title;
  dialog.appendChild(header);

  const body = document.createElement('div');
  body.className = 'modal-body';
  body.textContent = bodyText;
  dialog.appendChild(body);

  const form = document.createElement('form');
  form.className = 'modal-form';
  form.noValidate = true;

  if (type === 'loan') {
    const label = document.createElement('label');
    label.textContent = 'Nombre de la persona';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.name = 'persona';
    input.maxLength = 40;
    label.appendChild(input);
    form.appendChild(label);
  }

  const errorNode = document.createElement('p');
  errorNode.className = 'modal-error';
  form.appendChild(errorNode);

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'secondary-btn';
  cancelButton.textContent = cancelText;
  cancelButton.addEventListener('click', () => {
    if (onCancel) onCancel();
    closeModal();
  });

  const confirmButton = document.createElement('button');
  confirmButton.type = 'submit';
  confirmButton.className = type === 'danger' ? 'danger-btn' : 'primary-btn';
  confirmButton.textContent = confirmText;

  actions.appendChild(cancelButton);
  actions.appendChild(confirmButton);
  form.appendChild(actions);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (onConfirm) {
      const persona = form.querySelector('input[name="persona"]')?.value ?? '';
      const result = onConfirm(persona);
      if (result && result.error) {
        errorNode.textContent = result.error;
        return;
      }
    }
    closeModal();
  });

  dialog.appendChild(form);
  backdrop.appendChild(dialog);
  root.appendChild(backdrop);

  const firstControl = form.querySelector('input, button');
  if (firstControl) firstControl.focus();
}

export function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}
