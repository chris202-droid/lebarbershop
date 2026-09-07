// Charte graphique LEBARBERSHOP partagée par toutes les pages.
//
// Design clair et professionnel : fond blanc, motifs et accents verts,
// touches dorées/jaunes. `ink` reste le nom du fond principal et `ivory`
// celui du texte principal pour ne pas renommer toutes les références à
// travers le projet — seules leurs VALEURS ont changé (texte sombre sur
// fond clair au lieu de texte clair sur fond sombre).
export const T = {
  ink: "#FFFFFF",        // fond principal (était le vert profond)
  inkDeep: "#0F3D2E",     // vert forêt profond — sidebars, modals, panneaux "inversés", tickets
  ivory: "#122A20",       // texte principal, sombre sur fond clair (était clair sur fond sombre)
  titre: "#155C3D",       // vert riche et affirmé, réservé aux titres (police Fraunces) pour que le vert se ressente clairement dans toute l'interface
  gold: "#C9932A",        // accent doré/jaune — secondaire : montants, badges, logo
  coral: "#D9503C",       // erreurs, actions destructives
  mint: "#1E9E64",        // vert accent vif — succès, validations, deuxième teinte de vert
  line: "rgba(18,42,32,0.12)",  // bordures subtiles, cohérentes avec `ivory`

  // Texte clair, réservé aux zones à fond volontairement sombre
  // (sidebars, modals, reçus de ticket, dropdowns sur fond `inkDeep`) —
  // ne jamais utiliser sur le fond principal `ink` (blanc).
  clair: "#F5F1E8",
  clairAtt: (opacite) => `rgba(245,241,232,${opacite})`,
};

// Base RGB de `ivory`, utilisée dans tout le projet via rgba(18,42,32,X)
// pour moduler l'opacité du texte (hiérarchie visuelle) et des fonds
// subtils de carte — un seul repère de couleur pour tout le thème clair.
