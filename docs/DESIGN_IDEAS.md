# Manabu — Pistes de direction artistique

Document d'exploration (non figé). Trois directions possibles pour l'identité visuelle de l'app. On en choisira une (ou un mélange) avant de construire le design system (tokens Tailwind + composants shadcn/ui).

Rappel des contraintes transverses (voir `docs/PRD.md` §5) : **mobile-first**, zones tactiles ≥ 44px, contrastes accessibles, une action principale visible sans scroll dans le player, rendu clair du feedback quiz (correct/incorrect) et des mécaniques de jeu (vies, XP, série, badges).

---

## Idée 1 — Rétro gaming / pixel art

Une ambiance clin d'œil aux jeux vidéo rétro : ludique, mémorable, « collectionnite » naturelle pour les badges.

- **Pixel art ciblé** : icônes de **vie** (cœurs pixélisés), **avatars** des joueurs, **badges**, mascotte éventuelle. Le reste de l'UI (texte, formulaires) reste net et lisible — le pixel art est un accent, pas toute l'interface.
- **Palette** : couleurs vives et contrastées type palette 8/16-bits (mais filtrées pour rester accessibles). Fonds sombres possibles pour faire ressortir les sprites.
- **Typographie** : une police display pixel/bitmap pour les titres et le HUD (XP, série, vies) ; une police lisible non-pixel pour le corps de texte (confort de lecture des leçons).
- **Motion** : animations « steppées » (peu d'images, effet saccadé assumé), petits effets de récompense (gain d'XP qui « pop », badge qui se déverrouille avec un jingle visuel).
- **Risques** : lisibilité du pixel art sur écrans variés (prévoir des assets @1x/@2x ou du SVG « faux-pixel »), risque de paraître gadget si sur-utilisé. Bien cloisonner pixel art = accents.
- **Va bien avec** : gamification forte, badges à collectionner, public jeune/geek.

## Idée 2 — Clean & calme, « couleurs de la sagesse »

Un parti pris posé, épuré, propice à la concentration et à l'apprentissage sur la durée.

- **Palette** : tons doux et « sages » — encre profonde, bleus/verts sourds, beige/parchemin, touches d'or/ocre pour les récompenses. Beaucoup d'espace blanc (ou crème).
- **Typographie** : une serif élégante pour les titres (évoque le livre, le savoir) + une sans-serif très lisible pour le corps. Hiérarchie claire, générosité des interlignes.
- **Motion** : transitions douces et discrètes (fondus, glissements courts), rien de clinquant. Le feedback quiz reste net mais sobre.
- **Gamification en version « zen »** : vies, XP et série présents mais traités avec finesse (icônes fines, couleurs douces) plutôt qu'en fanfare.
- **Risques** : peut manquer de « peps » / d'accroche ludique face à des concurrents flashy ; veiller à ce que le feedback de jeu reste assez saillant pour être satisfaisant.
- **Va bien avec** : image de marque haut de gamme, apprentissage « sérieux », rétention par la sérénité plutôt que l'excitation.

## Idée 3 — Dynamique & moderne

L'esthétique « app mobile 2020s » : énergique, colorée, animée, très proche des codes actuels (dont Duolingo).

- **Palette** : couleurs franches et saturées, accents vifs, dégradés maîtrisés, gros aplats. Mode clair et sombre soignés.
- **Typographie** : sans-serif géométrique moderne, titres gras et généreux, chiffres bien lisibles pour les stats.
- **Motion** : animations vivantes et satisfaisantes (micro-interactions sur chaque bouton, barre de progression fluide, confettis/streak-flame à la complétion, secousse à l'erreur). Haptique-like visuel.
- **Composants** : grosses cartes arrondies, boutons pleins très cliquables, illustrations vectorielles colorées, mascotte animée optionnelle.
- **Risques** : proximité forte avec Duolingo (risque de « déjà-vu »/manque de différenciation) ; l'abondance d'animations doit rester perf sur mobile et désactivable (préférence « réduire les animations »).
- **Va bien avec** : engagement maximal, public large, viralité.

---

## Pour décider

Quelques axes pour trancher :

- **Positionnement** : ludique/geek (1), premium/serein (2), grand public/énergique (3) ?
- **Différenciation vs Duolingo** : 1 et 2 s'en éloignent nettement, 3 s'en rapproche.
- **Effort de production** : le pixel art (1) demande des assets dédiés ; 2 et 3 s'appuient surtout sur tokens + composants.
- **Mélange possible** : ex. base « clean & calme » (2) avec **accents pixel art** sur vies/badges/avatars (1) = identité douce mais ludique et différenciante.

> Prochaine étape une fois la direction choisie : définir les tokens (couleurs, typo, rayons, ombres, motion) dans la config Tailwind, puis décliner les composants clés (carte de parcours, player, HUD vies/XP/série, écran de résultat, badges).
