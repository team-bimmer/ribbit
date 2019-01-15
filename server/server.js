// react imports
import { StaticRouter } from 'react-router-dom';

const React = require('react');

const express = require('express');
const path = require('path');
const { exec } = require('child_process');
require('isomorphic-fetch');

const app = express();

// User app directory is received from arguments
const appDir = process.argv[2];
const ribbitRoutes = require(path.join(appDir, '/ribbit.routes.json'));
const ribbitConfig = require(path.join(appDir, '/ribbit.config.js'));
const appFile = `${appDir}/${ribbitConfig.app.slice(2)}`;

// Helper functions imports
const { buildCliCommand } = require('./helpers/buildCliCommand');
const { sendFetches } = require('./helpers/sendFetches');

// Middleware imports
const { htmlTemplate } = require('./controllers/htmlTemplate');
const { writeFile } = require('./controllers/writeFile');

const routeArray = ribbitRoutes.map(el => el.route);
const webpackCommand = `npx webpack App=${appFile} `;
const cliCommand = buildCliCommand(webpackCommand, ribbitRoutes, appDir);

app.get(
  routeArray,
  (req, res, next) => {
    const App = require(`../dist/App.js`).default;
    const context = {};
    let { url } = req;

    const jsx = (
      <StaticRouter context={context} location={url}>
        <App />
      </StaticRouter>
    );

    if (url === '/') url = '/Home';
    res.locals.appDir = appDir;
    res.locals.url = url;
    res.locals.jsx = jsx;
    next();
  },
  htmlTemplate,
  writeFile
);
app.use(express.static(ribbitConfig.bundleRoot));

// Create a new child process, that executes the passed in 'cli command'
// Child starts webpack and copies components over to the Ribbit directory
const webpackChild = exec(`${cliCommand}`, () => {
  // console.log('Rebuilt user app locally');
  // start server in callback (after webpack finishes running)
  app.listen(4000, () => {
    console.log('Listening on port 4000');
    // Send fetch request to all routes
    const fetchArray = sendFetches(ribbitRoutes, 4000);
    Promise.all(fetchArray)
      .then(data => {
        process.kill(process.pid, 'SIGINT');
      })
      .catch();
  });
});

// We can remove these next 3 functions in production
webpackChild.on('data', data => {
  process.stdout.write(data);
});
webpackChild.stderr.on('data', data => {
  process.stdout.write(data);
});
webpackChild.stderr.on('exit', data => {
  process.stdout.write('im done');
});
