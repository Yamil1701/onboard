// Targets decoded from the supplied QR images, plus the reel supplied by Cyntia.
// The QR labelled Wordwall duplicates the YouTube target; no Wordwall URL is invented.
export const archiveResources=[
  {
    url:'https://learningapps.org/1667266',platform:'LearningApps',
    title:{ar:'La nourriture · Alimentos y partitivos',fr:'La nourriture · Aliments et partitifs'},
    description:{ar:'Practicá los artículos partitivos con vocabulario de alimentos.',fr:'Entraîne-toi aux articles partitifs avec le vocabulaire des aliments.'},
    kind:{ar:'Actividad interactiva',fr:'Activité interactive'},
  },
  {
    url:'https://quizlet.com/ca/503704608/mme-st-dans-mon-frigo-in-my-fridge-flash-cards/',platform:'Quizlet',
    title:{ar:'Dans mon frigo · Tarjetas de repaso',fr:'Dans mon frigo · Cartes de révision'},
    description:{ar:'Un apoyo con tarjetas para repasar el vocabulario de la heladera.',fr:'Des cartes pour réviser le vocabulaire du réfrigérateur.'},
    kind:{ar:'Tarjetas interactivas',fr:'Cartes interactives'},
  },
  {
    url:'https://www.youtube.com/watch?v=bxRyPvmb14g',platform:'YouTube',
    title:{ar:'Video de la secuencia',fr:'Vidéo de la séquence'},
    description:{ar:'Un apoyo audiovisual para acompañar la secuencia sobre alimentos.',fr:'Un support vidéo pour accompagner la séquence sur les aliments.'},
    kind:{ar:'Video',fr:'Vidéo'},
  },
  {
    url:'https://www.instagram.com/reel/DY7ssR0TqFm/',platform:'Instagram',
    title:{ar:'Un truco para recordar la negación',fr:'Une astuce pour retenir la négation'},
    description:{ar:'El recurso breve que Cyntia propone para recordar el artículo en la negación.',fr:'Une courte ressource proposée par Cyntia pour retenir l’article dans la négation.'},
    kind:{ar:'Reel',fr:'Reel'},
  },
] as const;
