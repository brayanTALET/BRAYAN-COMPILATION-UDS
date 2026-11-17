// 5. MINIMISATION : transforme l'AFD en AFD minimal (algorithme de Moore).
// Idée : deux états sont équivalents si, pour tout mot, ils mènent tous les deux
// à l'acceptation ou tous les deux au rejet. On les fusionne.
//
// L'AFD reçu est partiel (une transition absente = rejet). On le traite comme s'il
// avait un état « puits » implicite, qui n'apparaît jamais dans le résultat.

export function minimiser(afd, prefixe = 'm') {
  const alphabet = afd.alphabet;
  const depart = afd.start;

  // Table de transitions : état -> (symbole -> état)
  const table = new Map();
  for (const etat of afd.states) table.set(etat, new Map());
  for (const t of afd.transitions) table.get(t.from).set(t.label, t.to);

  function aller(etat, symbole) {
    return table.get(etat)?.get(symbole);
  }

  // ÉTAPE 1 : ne garder que les états accessibles depuis l'état initial.
  const accessibles = new Set([depart]);
  const aVisiter = [depart];
  while (aVisiter.length > 0) {
    const etat = aVisiter.pop();
    for (const symbole of alphabet) {
      const cible = aller(etat, symbole);
      if (cible !== undefined && !accessibles.has(cible)) {
        accessibles.add(cible);
        aVisiter.push(cible);
      }
    }
  }

  // ÉTAPE 2 : retirer les états inutiles (impossible d'atteindre un état final).
  const productifs = new Set(afd.finals.filter(f => accessibles.has(f)));
  let changement = true;
  while (changement) {
    changement = false;
    for (const t of afd.transitions) {
      if (accessibles.has(t.from) && productifs.has(t.to) && !productifs.has(t.from)) {
        productifs.add(t.from);
        changement = true;
      }
    }
  }
  const utiles = [...accessibles].filter(q => productifs.has(q) || q === depart);

  // ÉTAPE 3 : partition initiale = états finaux / états non finaux.
  let classe = new Map(utiles.map(q => [q, afd.finals.includes(q) ? 1 : 0]));
  let nombreClasses = new Set(classe.values()).size;

  // ÉTAPE 4 : raffiner la partition jusqu'à ce qu'elle ne change plus.
  // Deux états restent ensemble s'ils sont dans la même classe ET si, pour chaque
  // symbole, leurs destinations sont dans la même classe (ou toutes deux absentes).
  while (true) {
    const signatures = new Map();
    const nouvelle = new Map();

    for (const q of utiles) {
      const signature = [
        classe.get(q),
        ...alphabet.map(symbole => {
          const cible = aller(q, symbole);
          return cible !== undefined && classe.has(cible) ? classe.get(cible) : 'X';
        })
      ].join(',');

      if (!signatures.has(signature)) signatures.set(signature, signatures.size);
      nouvelle.set(q, signatures.get(signature));
    }

    classe = nouvelle;
    if (signatures.size === nombreClasses) break; // plus aucune classe ne se divise
    nombreClasses = signatures.size;
  }

  // ÉTAPE 5 : construire l'AFD minimal. Une classe = un état, numéroté dans l'ordre
  // de découverte à partir de l'état initial.
  const representant = new Map();
  for (const q of utiles) {
    if (!representant.has(classe.get(q))) representant.set(classe.get(q), q);
  }

  const ordre = [classe.get(depart)];
  const noms = new Map([[ordre[0], `${prefixe}0`]]);
  const transitions = [];

  for (let i = 0; i < ordre.length; i++) {
    const etatRepresentant = representant.get(ordre[i]);

    for (const symbole of alphabet) {
      const cible = aller(etatRepresentant, symbole);
      if (cible === undefined || !classe.has(cible)) continue;

      const classeCible = classe.get(cible);
      if (!noms.has(classeCible)) {
        noms.set(classeCible, `${prefixe}${ordre.length}`);
        ordre.push(classeCible);
      }

      transitions.push({
        from: noms.get(ordre[i]),
        to: noms.get(classeCible),
        label: symbole
      });
    }
  }

  return {
    states: ordre.map(c => noms.get(c)),
    alphabet,
    transitions,
    start: `${prefixe}0`,
    finals: ordre.filter(c => afd.finals.includes(representant.get(c))).map(c => noms.get(c)),
    // Pour chaque état minimal, les états de l'AFD d'origine qui ont été fusionnés.
    fusions: ordre.map(c => ({
      nom: noms.get(c),
      anciens: utiles.filter(q => classe.get(q) === c)
    }))
  };
}
