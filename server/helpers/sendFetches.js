export function sendFetches(routeConfig, port) {
  const routes = routeConfig.map(el => el.route);
  const fetches = [];
  routes.forEach(route => {
    const a = new Promise((resolve, reject) => {
      fetch(`http://localhost:${port}${route}`)
        .then(() => {
          resolve();
        })
        .catch(error => {
          console.error('Error fetching from local server: ', error);
          reject();
        });
    });

    fetches.push(a);
  });
  return fetches;
}
