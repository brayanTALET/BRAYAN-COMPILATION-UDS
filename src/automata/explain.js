// Transforme le résultat de recognize() en message lisible pour l'utilisateur.
export function explainWord(afd, mot, r) {
  const affiche = mot === '' ? 'ε (mot vide)' : `« ${mot} »`;
  const chemin = r.path.join(' → ');

  if (r.blockedOn !== undefined) {
    const rang = r.steps.length; // nombre de symboles lus avant le blocage
    const prefixe = Array.from(mot).slice(0, rang).join('');
    if (!afd.alphabet.includes(r.blockedOn)) {
      return `Le symbole « ${r.blockedOn} » (position ${rang + 1}) n'appartient pas à l'alphabet {${afd.alphabet.join(', ')}} de l'expression.`;
    }
    return `Après « ${prefixe || 'ε'} », l'automate est dans l'état ${r.finalState} et n'a aucune transition pour « ${r.blockedOn} » (position ${rang + 1}) : aucun mot du langage ne commence par « ${prefixe + r.blockedOn} ».`;
  }

  if (r.accepted) {
    return `${affiche} appartient au langage : l'automate lit le mot en entier et s'arrête dans l'état final ${r.finalState}. Parcours : ${chemin}.`;
  }
  return `${affiche} est lu en entier, mais l'état atteint ${r.finalState} n'est pas final : c'est le début d'un mot du langage, pas un mot complet. Parcours : ${chemin}.`;
}
