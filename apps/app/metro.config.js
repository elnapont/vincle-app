// Configuració de Metro per a un monorepo amb npm workspaces.
//
// Per defecte Metro només mira dins de la carpeta de l'app. Aquí li hem de dir
// dues coses: que vigili també els paquets de /packages (perquè els canvis s'hi
// reflecteixin sense reiniciar) i que sàpiga resoldre les dependències que npm
// hissa a l'arrel del monorepo.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const arrelApp = __dirname;
const arrelMonorepo = path.resolve(arrelApp, '../..');

const config = getDefaultConfig(arrelApp);

config.watchFolders = [arrelMonorepo];
config.resolver.nodeModulesPaths = [
  path.resolve(arrelApp, 'node_modules'),
  path.resolve(arrelMonorepo, 'node_modules'),
];
// Els paquets del monorepo s'importen com a codi font TypeScript, sense build.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
