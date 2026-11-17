// 4. RECONNAISSANCE : vérifie si un mot est accepté par l'AFD.

export function recognize(afd, mot) {
  let etatCourant = afd.start;
  const parcours = [etatCourant];
  const etapes = [];

  // Lire le mot caractère par caractère.
  for (const symbole of mot) {
    let prochainEtat = undefined;

    // Chercher la transition correspondant à l'état et au symbole.
    for (const transition of afd.transitions) {
      if (transition.from === etatCourant && transition.label === symbole) {
        prochainEtat = transition.to;
        break;
      }
    }

    // Pas de transition : le mot est rejeté immédiatement.
    if (prochainEtat === undefined) {
      return {
        accepted: false,
        finalState: etatCourant,
        path: parcours,
        steps: etapes,
        blockedOn: symbole
      };
    }

    etapes.push({
      from: etatCourant,
      symbol: symbole,
      to: prochainEtat
    });

    etatCourant = prochainEtat;
    parcours.push(etatCourant);
  }

  // Le mot est accepté uniquement si l'état atteint est final.
  return {
    accepted: afd.finals.includes(etatCourant),
    finalState: etatCourant,
    path: parcours,
    steps: etapes
  };
}
