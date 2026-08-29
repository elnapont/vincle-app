// Configuració d'ESLint.
//
// El motiu principal de tenir-la és `react-hooks/rules-of-hooks`: cridar un hook
// després d'un `return` condicional fa petar l'aplicació en execució amb un error
// que no diu gaire, i el compilador de tipus no ho pot veure perquè és una regla
// de React i no del llenguatge. Va passar a la fitxa de raça.
const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  {
    rules: {
      // Desactivada a posta: la regla avisa dels apòstrofs dins de JSX per si són
      // cometes mal tancades. En un producte en català l'apòstrof surt a gairebé
      // cada frase —«d'avui», «l'entrenadora»— i escriure'ls com a entitats HTML
      // faria el codi il·legible sense guanyar res.
      'react/no-unescaped-entities': 'off',
    },
  },
];
