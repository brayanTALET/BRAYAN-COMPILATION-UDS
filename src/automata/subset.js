// 3. DETERMINISATION : transforme l'AFN-ε en AFD.
// Idée : un état de l'AFD représente un groupe d'états de l'AFN.

export function determinize(afn) {
  // Récupérer les symboles de l'alphabet, sans ε et sans doublons.
  const alphabet = [];
  for (const t of afn.transitions) {
    if (t.label !== 'ε' && !alphabet.includes(t.label)) {
      alphabet.push(t.label);
    }
  }
  alphabet.sort();

  // Renvoie tous les états accessibles depuis le groupe en ne suivant
  // que des transitions ε.
  function fermetureEpsilon(groupe) {
    const resultat = [...groupe];
    const aVisiter = [...groupe];

    while (aVisiter.length > 0) {
      const etat = aVisiter.pop();

      for (const t of afn.transitions) {
        if (t.from === etat && t.label === 'ε' && !resultat.includes(t.to)) {
          resultat.push(t.to);
          aVisiter.push(t.to);
        }
      }
    }

    return resultat.sort((a, b) => a - b);
  }

  // Depuis un groupe d'états, suivre un symbole donné.
  function aller(groupe, symbole) {
    const resultat = [];

    for (const etat of groupe) {
      for (const t of afn.transitions) {
        if (t.from === etat && t.label === symbole && !resultat.includes(t.to)) {
          resultat.push(t.to);
        }
      }
    }

    return resultat;
  }

  // Une clé permet de reconnaître si un groupe a déjà été créé.
  function cle(groupe) {
    return [...groupe].sort((a, b) => a - b).join(',');
  }

  // Le premier état de l'AFD est la fermeture ε de l'état initial de l'AFN.
  const groupeInitial = fermetureEpsilon([afn.start]);
  const groupes = [groupeInitial];
  const noms = new Map([[cle(groupeInitial), 'q0']]);
  const transitions = [];

  // Traiter chaque groupe, puis les nouveaux groupes découverts.
  for (let i = 0; i < groupes.length; i++) {
    const groupeActuel = groupes[i];
    const nomDepart = noms.get(cle(groupeActuel));

    for (const symbole of alphabet) {
      const destinations = aller(groupeActuel, symbole);
      const nouveauGroupe = fermetureEpsilon(destinations);

      // Aucun état atteint : aucune transition à ajouter.
      if (nouveauGroupe.length === 0) continue;

      const identifiant = cle(nouveauGroupe);
      let nomArrivee = noms.get(identifiant);

      // Si le groupe est nouveau, créer un nouvel état qN.
      if (nomArrivee === undefined) {
        nomArrivee = `q${groupes.length}`;
        noms.set(identifiant, nomArrivee);
        groupes.push(nouveauGroupe);
      }

      transitions.push({
        from: nomDepart,
        to: nomArrivee,
        label: symbole
      });
    }
  }

  // Un état de l'AFD est final s'il contient au moins un état final de l'AFN.
  const etatsFinaux = [];
  for (let i = 0; i < groupes.length; i++) {
    const contientUnFinal = groupes[i].some(etat => afn.accepts.includes(etat));
    if (contientUnFinal) etatsFinaux.push(`q${i}`);
  }

  return {
    states: groupes.map((groupe, i) => `q${i}`),
    alphabet,
    transitions,
    start: 'q0',
    finals: etatsFinaux
  };
}
