# Manabu

Application d'apprentissage gamifiée (façon Duolingo) : parcours de cours découpés en unités et leçons, mêlant contenu et quiz, avec mécaniques d'engagement (XP, séries, vies, badges).

## Language

### Personnes & rôles

**Apprenant** :
Utilisateur qui suit les cours et dont la progression est enregistrée. Rôle par défaut (`learner`).
_Avoid_: Élève, étudiant, joueur, membre

**Admin** :
Utilisateur ayant accès au back-office (création/import de contenu, gestion des utilisateurs). Rôle `admin`.
_Avoid_: Formateur, éditeur, modérateur, gestionnaire

**Profil** :
Les données applicatives d'un utilisateur (rôle, gamification, fuseau, statut actif), portées par l'enregistrement utilisateur en base. L'authentification (mots de passe, sessions, MFA) est gérée par Better Auth dans cette même base.
_Avoid_: Compte (préférer « utilisateur »/« profil »)

### Contenu pédagogique

**Cours** :
Un parcours d'apprentissage complet sur un sujet, découpé en unités. Unité de publication (brouillon / publié).
_Avoid_: Formation, module, programme

**Unité** :
Un regroupement ordonné de leçons au sein d'un cours (un chapitre).
_Avoid_: Chapitre, section, module

**Leçon** :
Une séquence ordonnée d'**étapes** intercalées (contenu et quiz mêlés librement), jouée d'un bloc par l'apprenant. Plus petite unité de progression et de déblocage.
_Avoid_: Exercice, activité

**Étape** :
Un écran unique dans une leçon, d'un seul type : soit **contenu**, soit **quiz** (une seule question). Les étapes s'enchaînent une à une.
_Avoid_: Slide, écran, carte, page

**Quiz** :
Une étape d'évaluation portant **une seule question** (choix unique/multiple, association, texte à trous, remise en ordre). « Quiz » désigne l'étape-question, pas un bloc de plusieurs questions.
_Avoid_: Test, examen, exercice, QCM (QCM = un type de quiz parmi d'autres)

**Contenu** :
Une étape non évaluée (texte Markdown + média optionnel) qui explique ou introduit.
_Avoid_: Cours (réservé au parcours complet), théorie, leçon

### Jeu & progression

**Tentative** :
Un passage d'un apprenant sur une leçon, du début jusqu'à la complétion ou l'échec. Chaque tentative repart de zéro avec des vies fraîches. Une tentative en cours est reprenable (état persisté).
_Avoid_: Session, essai, run

**Vie** :
Un crédit d'erreur au sein d'une **tentative** (défaut 3). Une mauvaise réponse en consomme une ; à zéro, la tentative échoue. Propre à la tentative, jamais un stock global partagé entre leçons.
_Avoid_: Cœur, point de vie, PV, crédit

**Complétée** (leçon) :
État d'une leçon dont toutes les questions ont été finalement réussies au cours d'une tentative sans épuiser les vies. Une leçon complétée est définitivement acquise.
_Avoid_: Réussie, validée, terminée (ambigu), passée

**Parfaite** (leçon) :
Qualifie une tentative complétée sans avoir perdu la moindre vie (aucune erreur). Déclenche un bonus d'XP / badge.
_Avoid_: Sans faute, 100 %, score parfait
