import { useMemo, useState } from 'react';
import { parseRegex } from './automata/parser';
import { buildThompson } from './automata/thompson';
import { determinize } from './automata/subset';
import { minimiser } from './automata/minimise';
import { recognize } from './automata/recognize';
import { explainWord } from './automata/explain';
import Automaton from './components/Automaton';

const EXAMPLES = ['(a|b)*abb', 'a(b|c)*d', '(ab)*|c'];

export default function App() {
  const [regex, setRegex] = useState('(a|b)*abb');
  const [word, setWord] = useState('');

  // Étapes 1, 2, 5, 6 : analyse (validité), puis AFN (Thompson), puis AFD (sous-ensembles)
  const model = useMemo(() => {
    try {
      const afn = buildThompson(parseRegex(regex));
      const afd = determinize(afn);
      return { valid: true, afn, afd, afdMin: minimiser(afd) };
    } catch (e) {
      // parseRegex écrit « (position N). » à la fin de ses messages : on en tire la position du ^
      const m = /\(position (\d+)\)\.$/.exec(e.message);
      return { valid: false, message: e.message, position: m ? Number(m[1]) - 1 : null };
    }
  }, [regex]);

  // Étapes 3 et 4 : test du mot
  const verdict = useMemo(() => {
    if (!model.valid) return null;
    const mot = word === 'ε' || word === '€' ? '' : word;
    const r = recognize(model.afd, mot);
    return { ok: r.accepted, reason: explainWord(model.afd, mot, r) };
  }, [model, word]);

  return (
    <main className="page">
      <header>
        <h1>Reconnaissance d'un langage régulier</h1>
        <p className="lead">Expression régulière, puis AFN (Thompson), puis AFD (sous-ensembles).</p>
      </header>

      <section>
        <h2>Expression régulière</h2>
        <input className="field mono" value={regex} spellCheck={false} onChange={(e) => setRegex(e.target.value)} aria-label="Expression régulière" placeholder="ex. (a|b)*abb" />
        <div className="chips">
          {EXAMPLES.map((ex) => <button key={ex} className="chip mono" onClick={() => setRegex(ex)}>{ex}</button>)}
        </div>
        <p className="hint">Union : <code>|</code> · étoile : <code>*</code> · groupes : <code>( )</code> · mot vide : <code>ε</code>. La concaténation s'écrit par juxtaposition, les espaces sont ignorés.</p>

        {model.valid ? (
          <p className="msg ok">Expression valide. Alphabet : {'{'}{model.afd.alphabet.join(', ')}{'}'}</p>
        ) : (
          <div className="msg bad">
            <p>{model.message}</p>
            {model.position !== null && <pre className="mono pointer" aria-hidden="true">{regex}{'\n'}{' '.repeat(model.position)}^</pre>}
          </div>
        )}
      </section>

      <section>
        <h2>Tester un mot</h2>
        <input className="field mono" value={word} disabled={!model.valid} spellCheck={false} onChange={(e) => setWord(e.target.value)} aria-label="Mot à tester" placeholder={model.valid ? 'Saisis un mot (vide = ε)' : 'Corrige d’abord l’expression'} />
        {verdict && <p className={`msg ${verdict.ok ? 'ok' : 'bad'}`}>{verdict.reason}</p>}
      </section>

      {model.valid && (
        <>
          <section>
            <h2>AFN <span className="count">{model.afn.states} états</span></h2>
            <p className="hint">Transitions ε notées « ε ». Flèche entrante : état initial. Double cercle : état final.</p>
            <Automaton auto={model.afn} prefix="q" markerId="afn" title="AFN" />
          </section>

          <section>
            <h2>AFD <span className="count">{model.afd.states.length} états</span></h2>
            <Automaton auto={model.afd} markerId="afd" title="AFD" />
          </section>

          <section>
            <h2>AFD minimal <span className="count">{model.afdMin.states.length} états{model.afdMin.states.length < model.afd.states.length ? ` (au lieu de ${model.afd.states.length})` : ' (l\u2019AFD était déjà minimal)'}</span></h2>
            <Automaton auto={model.afdMin} markerId="min" title="AFD minimal" />
            <ul className="subsets mono">
              {model.afdMin.fusions.map((f) => <li key={f.nom}>{f.nom} = {'{'}{f.anciens.join(', ')}{'}'}</li>)}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
