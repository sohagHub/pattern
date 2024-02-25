/**
 * @file The application root. Defines the Express server configuration.
 */

const express = require('express');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const { errorHandler } = require('./middleware');

const {
  usersRouter,
  sessionsRouter,
  itemsRouter,
  accountsRouter,
  institutionsRouter,
  serviceRouter,
  linkEventsRouter,
  linkTokensRouter,
  unhandledRouter,
  assetsRouter,
} = require('./routes');

const app = express();

const { PORT } = process.env;

const server = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
const io = socketIo(server);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// middleware to pass socket to each request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Set socket.io listeners.
io.on('connection', socket => {
  console.log('SOCKET CONNECTED');

  socket.on('disconnect', () => {
    console.log('SOCKET DISCONNECTED');
  });
});

app.get('/api/test', (req, res) => {
  res.send('test response');
});

app.use('/api/users', usersRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/items', itemsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/institutions', institutionsRouter);
app.use('/api/services', serviceRouter);
app.use('/api/link-event', linkEventsRouter);
app.use('/api/link-token', linkTokensRouter);
app.use('/api/assets', assetsRouter);
app.use('*', unhandledRouter);

// Error handling has to sit at the bottom of the stack.
// https://github.com/expressjs/express/issues/2718
app.use(errorHandler);
