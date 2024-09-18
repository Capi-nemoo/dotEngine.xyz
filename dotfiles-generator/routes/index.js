// routes/index.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const handlebars = require('handlebars');
const archiver = require('archiver');

// Registrar helpers de Handlebars
handlebars.registerHelper('split', function(string, delimiter) {
  if (!string) return [];
  return string.split(delimiter).map(item => item.trim());
});

// Cargar todas las plantillas al inicio
const loadTemplates = () => {
  const templatesDir = path.join(__dirname, '../templates');
  const templates = {};

  const readTemplates = (dir, namespace = '') => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        readTemplates(fullPath, `${namespace}${file}/`);
      } else if (path.extname(file) === '.hbs') {
        const templateName = `${namespace}${path.basename(file, '.hbs')}`;
        const templateContent = fs.readFileSync(fullPath, 'utf-8');
        templates[templateName] = handlebars.compile(templateContent);
      }
    });
  };

  readTemplates(templatesDir);
  return templates;
};

const templates = loadTemplates();

// Ruta principal que renderiza el formulario
router.get('/', (req, res) => {
  res.render('index');
});

// Ruta para generar y descargar los dotfiles
router.post('/generate', (req, res) => {
  const data = {
    shell: req.body.shell,
    editor: req.body.editor,
    theme: req.body.theme,
    font_size: req.body.font_size,
    // Configuraciones específicas de Vim
    vim_tabstop: req.body.vim_tabstop,
    vim_shiftwidth: req.body.vim_shiftwidth,
    vim_plugins: req.body.vim_plugins,
    // Configuraciones específicas de Emacs
    emacs_theme: req.body.emacs_theme,
    emacs_packages: req.body.emacs_packages,
    // Configuraciones específicas de VS Code
    code_extensions: req.body.code_extensions,
    code_settings: req.body.code_settings,
    // Configuraciones específicas de Sublime Text
    sublime_packages: req.body.sublime_packages,
    sublime_theme: req.body.sublime_theme
  };

  const zipPath = path.join(__dirname, '../public/dotfiles.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', () => {
    res.download(zipPath, 'dotfiles.zip', (err) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error al generar el archivo ZIP');
      }
      // Eliminar el ZIP después de descargar
      fs.unlinkSync(zipPath);
    });
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // Procesar y añadir cada plantilla al ZIP
  Object.keys(templates).forEach(templateName => {
    const content = templates[templateName](data);
    const fileName = `.${templateName.replace('/', '.')}`; // Ejemplo: 'vim/vimrc' -> '.vimrc'
    archive.append(content, { name: fileName });
  });

  archive.finalize();
});

module.exports = router;
