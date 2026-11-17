// 2. CONSTRUCTION DE THOMPSON : expression/arbre -> AFN avec transitions ε.
// Chaque morceau possède un état de départ et un état d'arrivée.

export function buildThompson(arbre) {
  let prochainEtat = 0;
  const transitions = [];

  function creerEtat() {
    return prochainEtat++;
  }

  function ajouterTransition(depart, arrivee, symbole) {
    transitions.push({ from: depart, to: arrivee, label: symbole });
  }

  function construire(noeud) {
    const debut = creerEtat();
    const fin = creerEtat();

    if (noeud.type === 'symbol') {
      ajouterTransition(debut, fin, noeud.value);
    }

    else if (noeud.type === 'epsilon') {
      ajouterTransition(debut, fin, 'ε');
    }

    else if (noeud.type === 'union') {
      const gauche = construire(noeud.left);
      const droite = construire(noeud.right);

      // On peut choisir la branche gauche OU la branche droite.
      ajouterTransition(debut, gauche.start, 'ε');
      ajouterTransition(debut, droite.start, 'ε');
      ajouterTransition(gauche.accept, fin, 'ε');
      ajouterTransition(droite.accept, fin, 'ε');
    }

    else if (noeud.type === 'concat') {
      let etatCourant = debut;

      // Relier les morceaux les uns à la suite des autres.
      for (const morceau of noeud.parts) {
        const sousAutomate = construire(morceau);
        ajouterTransition(etatCourant, sousAutomate.start, 'ε');
        etatCourant = sousAutomate.accept;
      }

      ajouterTransition(etatCourant, fin, 'ε');
    }

    else if (noeud.type === 'star') {
      const sousAutomate = construire(noeud.child);

      // Une étoile autorise : zéro répétition, ou une répétition puis retour.
      ajouterTransition(debut, fin, 'ε');
      ajouterTransition(debut, sousAutomate.start, 'ε');
      ajouterTransition(sousAutomate.accept, sousAutomate.start, 'ε');
      ajouterTransition(sousAutomate.accept, fin, 'ε');
    }

    else {
      throw new Error(`Type d'expression inconnu : ${noeud.type}`);
    }

    return { start: debut, accept: fin };
  }

  const automate = construire(arbre);

  return {
    states: prochainEtat,
    transitions,
    start: automate.start,
    accepts: [automate.accept]
  };
}
