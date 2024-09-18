// app.js
const express = require('express');
const path = require('path');
const app = express();

// Configuraciones
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Rutas
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// Escuchar en el puerto 3000
app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});

