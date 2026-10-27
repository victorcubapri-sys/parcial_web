# Biblioteca Digital

Aplicación web para gestionar un catálogo de libros, préstamos, historial y estadísticas, desarrollada con HTML5, CSS3 y JavaScript puro.

## Requisitos

- Visual Studio Code
- Extensión Live Server (recomendada)
- Navegador moderno

## Ejecutar

1. Abre la carpeta del proyecto.
2. Haz clic derecho en `index.html` y selecciona `Open with Live Server`.
3. O bien abre el archivo en el navegador.

## Estructura

- `index.html`: estructura principal de la interfaz.
- `css/styles.css`: estilos del dashboard y diseño responsivo.
- `js/data.js`: inicialización y persistencia con `localStorage`.
- `js/logic.js`: reglas de negocio, validaciones y cálculos.
- `js/ui.js`: renderizado y creación de componentes visuales.
- `js/app.js`: eventos, navegación y coordinación del flujo.

## Publicar en GitHub

1. Crea un repositorio nuevo en GitHub.
2. Inicializa el repositorio local con `git init`.
3. Añade todos los archivos: `git add .`.
4. Haz el primer commit: `git commit -m "Initial commit"`.
5. Conecta el repositorio remoto: `git remote add origin <URL_DEL_REPO>`.
6. Sube los cambios: `git push -u origin main`.

## Funciones principales

- Prestar un libro: se gestiona en `js/logic.js` mediante `canCreateNewLoan()` y `createBookLoan()`.
- Devolver un libro: se gestiona con `returnLoanBook()` en `js/logic.js` y la lógica de la vista en `js/app.js`.
- Editar un libro: se activa desde el catálogo y se procesa en el formulario de `js/app.js`.
- Eliminar un libro: se valida en `deleteBookWithHistory()` y se ejecuta desde la vista de catálogo.
- Guardar libros: la persistencia se realiza en `js/data.js` con `saveAppData()`.

## Observaciones

La aplicación guarda los datos en `localStorage`, por lo que la información se conserva al recargar la página.
