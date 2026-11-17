// Analyseur syntaxique d'expressions régulières.
// Il transforme une expression en arbre (AST) avant toute construction d'automate.
// Opérateurs pris en charge : | (union), juxtaposition (concaténation), * (étoile), ε.

const LONGUEUR_MAX = 256;
const PROFONDEUR_MAX = 64;
const EST_SYMBOLE = /^[a-zA-Z0-9_.+-]$/;
function erreur(message, position) {
  throw new Error(`${message} (position ${position + 1}).`);
}

function lireCaracteres(expression) {
  if (typeof expression !== 'string' || expression.trim() === '') {
    throw new Error('Expression vide : saisissez une expression régulière.');
  }

  if (expression.length > LONGUEUR_MAX) {
    throw new Error(`Expression trop longue : ${LONGUEUR_MAX} caractères maximum.`);
  }

  const caracteres = [];

  for (let i = 0; i < expression.length; i++) {
    const caractere = expression[i];

    // Les espaces ne participent pas à l'expression.
    if (/\s/.test(caractere)) continue;

    if ('|*()'.includes(caractere) || EST_SYMBOLE.test(caractere)) {
      caracteres.push({ valeur: caractere, position: i });
    } else if (caractere === 'ε' || caractere === '€') {
      caracteres.push({ valeur: 'ε', position: i });
    } else {
      erreur(`Caractère non autorisé : « ${caractere} »`, i);
    }
  }

  if (caracteres.length === 0) {
    throw new Error('Expression vide : saisissez une expression régulière.');
  }

  return caracteres;
}

export function parseRegex(expression) {
  const caracteres = lireCaracteres(expression);
  let position = 0;
  let profondeur = 0;

  function regarder() {
    return caracteres[position];
  }

  function consommer() {
    return caracteres[position++];
  }

  function valeurActuelle() {
    return regarder()?.valeur;
  }

  function positionActuelle() {
    return regarder()?.position ?? expression.length;
  }

  function commenceUnAtome(valeur) {
    return valeur === 'ε' || valeur === '(' || EST_SYMBOLE.test(valeur || '');
  }

  function lireExpression() {
    let gauche = lireConcatenation();

    while (valeurActuelle() === '|') {
      consommer(); // consomme |

      if (!commenceUnAtome(valeurActuelle())) {
        erreur('Il manque une expression après l’opérateur « | »', positionActuelle());
      }

      const droite = lireConcatenation();
      gauche = { type: 'union', left: gauche, right: droite };
    }

    return gauche;
  }

  function lireConcatenation() {
    if (!commenceUnAtome(valeurActuelle())) {
      erreur('Un symbole ou une parenthèse ouvrante était attendu', positionActuelle());
    }

    const elements = [lireFacteur()];

    while (commenceUnAtome(valeurActuelle())) {
      elements.push(lireFacteur());
    }

    return elements.length === 1
      ? elements[0]
      : { type: 'concat', parts: elements };
  }

  function lireFacteur() {
    let element = lireAtome();

    if (valeurActuelle() === '*') {
      consommer();
      element = { type: 'star', child: element };

      // Une deuxième étoile consécutive est redondante et souvent accidentelle.
      if (valeurActuelle() === '*') {
        erreur('Opérateur « * » répété : un seul suffit après un élément', positionActuelle());
      }
    }

    return element;
  }

  function lireAtome() {
    const caractere = consommer();
    if (!caractere) {
      erreur('Expression incomplète : un élément était attendu', expression.length);
    }

    const c = caractere.valeur;

    if (c === 'ε') return { type: 'epsilon' };
    if (EST_SYMBOLE.test(c)) return { type: 'symbol', value: c };

    if (c === '(') {
      profondeur++;
      if (profondeur > PROFONDEUR_MAX) {
        erreur(`Imbrication trop profonde : ${PROFONDEUR_MAX} niveaux maximum`, caractere.position);
      }

      if (valeurActuelle() === ')') {
        erreur('Les parenthèses ne peuvent pas être vides', positionActuelle());
      }

      const expressionInterne = lireExpression();
      profondeur--;

      if (valeurActuelle() !== ')') {
        erreur('Parenthèse fermante « ) » manquante', expression.length);
      }

      consommer();
      return expressionInterne;
    }

    if (c === ')') {
      erreur('Parenthèse fermante sans parenthèse ouvrante correspondante', caractere.position);
    }

    erreur(`Élément inattendu : « ${c} »`, caractere.position);
  }

  const arbre = lireExpression();

  if (position < caracteres.length) {
    const reste = caracteres[position];
    if (reste.valeur === ')') {
      erreur('Parenthèse fermante sans parenthèse ouvrante correspondante', reste.position);
    }
    erreur(`Symbole inattendu : « ${reste.valeur} »`, reste.position);
  }

  return arbre;
}
