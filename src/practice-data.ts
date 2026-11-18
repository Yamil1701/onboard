export type Bilingual={ar:string;fr:string};
export const l=(ar:string,fr:string):Bilingual=>({ar,fr});
export const practiceAssets='materiales/practicas/';
export const productionTexts=[
  {title:'Cachi · Miraluna',text:'Bienvenue à Cachi, dans les vallées Calchaquíes, dans la province de Salta. On peut visiter la bodega Miraluna, découvrir le musée archéologique Pío Pablo Díaz et admirer la Cuesta del Obispo. Un cépage emblématique est le Torrontés. Nous conseillons ce parcours parce qu’il fait partie de la Route des vins et permet de découvrir des domaines viticoles et de beaux paysages. Reviendriez-vous à Cachi ? Qu’avez-vous pensé de la visite de la cave ?'},
  {title:'Cachi · Découverte',text:'Cachi se situe dans la province de Salta, en Argentine, dans les vallées Calchaquíes. On peut admirer de magnifiques paysages et découvrir la culture locale. Nous conseillons ce parcours parce qu’il permet de découvrir la culture, les vins et les paysages de Cachi.'},
  {title:'Cachi · Puna',text:'Bienvenue à Cachi, au cœur des vallées Calchaquíes, à l’ouest de la province de Salta, en Argentine. On peut visiter la bodega Puna pour découvrir ses vins d’altitude, le musée archéologique municipal et les paysages du Nevado de Cachi. On peut aussi admirer les maisons blanches et les façades en adobe. Le Malbec et le Torrontés sont deux cépages représentatifs de la région. Nous conseillons ce parcours parce qu’il associe traditions ancestrales, paysages andins et œnotourisme. Êtes-vous prêts à découvrir Cachi et ses vins ?'},
  {title:'Cafayate · El Esteco',text:'Bienvenue à Cafayate, au cœur des vallées Calchaquíes, à 1 683 mètres d’altitude. On peut visiter la bodega El Esteco et déguster ses vins d’altitude. On peut découvrir le musée de la Vigne et du Vin pour connaître l’histoire de la région. On peut admirer l’architecture coloniale, les vignobles et les paysages de la Quebrada de las Conchas. Un cépage emblématique est le Torrontés. Nous conseillons ce parcours parce qu’il offre une expérience sensorielle entre traditions, paysages andins et vins. Êtes-vous prêts à découvrir les arômes du Torrontés ?'},
  {title:'Cafayate · Trois activités',text:'Bienvenue à Cafayate, dans la province de Salta, au nord-ouest de l’Argentine, dans les vallées Calchaquíes. On peut visiter la bodega El Esteco, découvrir le musée de la Vigne et du Vin et admirer les formations rocheuses de la Quebrada de las Conchas. Un cépage emblématique est le Torrontés, utilisé pour produire des vins blancs aromatiques et fruités.'},
  {title:'Cachi · Adentro',text:'Bienvenue à Cachi, dans les vallées Calchaquíes, dans la province de Salta. On peut visiter la bodega Adentro, découvrir le musée archéologique Pío Pablo Díaz et admirer le Nevado de Cachi. Un cépage emblématique de la région est le Torrontés. Reviendriez-vous à Cachi ?'},
  {title:'Cachi · Vins d’altitude',text:'Bienvenue à Cachi, au cœur des vallées Calchaquíes. Cachi séduit par ses montagnes, son architecture traditionnelle et ses vignobles d’altitude. Le soleil intense, l’amplitude thermique et les sols de montagne contribuent à l’identité des vins. Les vignobles du haut de la vallée bénéficient d’un fort ensoleillement et de nuits fraîches. Ce parcours réunit nature, culture et rencontre avec les producteurs.'},
  {title:'Cafayate · Nature et culture',text:'Bienvenue à Cafayate, une destination située dans les vallées Calchaquíes, dans la province de Salta, en Argentine. Cafayate est célèbre pour ses vignobles, ses vins, ses paysages et sa culture. C’est une destination idéale pour découvrir la nature et le tourisme vitivinicole.'},
];
export const vinification=[
  {name:'Vendange',definition:'Récolter les raisins.',es:'Cosechar las uvas.'},
  {name:'Foulage',definition:'Ouvrir les baies.',es:'Romper las bayas para liberar el jugo.'},
  {name:'Macération',definition:'Laisser le jus au contact des peaux.',es:'Dejar el jugo en contacto con los hollejos.'},
  {name:'Fermentation',definition:'Transformer les sucres en alcool avec les levures.',es:'Transformar los azúcares en alcohol mediante las levaduras.'},
  {name:'Pressurage',definition:'Extraire le jus par pression.',es:'Extraer el líquido mediante presión.'},
  {name:'Élevage',definition:'Conserver et faire évoluer le vin en cuve ou en fût.',es:'Conservar y dejar evolucionar el vino en tanque o barrica.'},
  {name:'Assemblage',definition:'Réunir des cépages, parcelles ou lots ; opération facultative.',es:'Combinar cepas, parcelas o lotes; es una operación opcional.'},
  {name:'Mise en bouteille',definition:'Remplir, fermer et étiqueter les bouteilles.',es:'Llenar, cerrar y etiquetar las botellas.'},
];
export const pairings=[
  {food:'Empanada salteña',wine:'Torrontés pétillant',reason:l('La frescura y las burbujas ayudan a refrescar el paladar entre bocados.','La fraîcheur et les bulles rafraîchissent le palais entre les bouchées.')},
  {food:'Locro',wine:'Malbec',reason:l('La estructura del vino acompaña la intensidad del plato.','La structure du vin accompagne l’intensité du plat.')},
  {food:'Asado / viande rouge',wine:'Vin rouge tannique',reason:l('Un tinto con taninos y cuerpo puede acompañar la carne.','Un rouge tannique et charpenté peut accompagner la viande.')},
  {food:'Humita',wine:'Vin blanc sec et vif',reason:l('La acidez aporta un contraste fresco a la textura del plato.','L’acidité apporte un contraste frais avec la texture du plat.')},
  {food:'Tamal',wine:'Muscat doux',reason:l('Si el tamal es picante, el dulzor puede suavizar esa sensación.','Si le tamal est piquant, la douceur peut atténuer cette sensation.')},
  {food:'Quesillo avec miel',wine:'Vin de vendanges tardives',reason:l('Un vino dulce puede acompañar la miel; el equilibrio depende de la preparación.','Un vin doux peut accompagner le miel ; l’équilibre dépend de la préparation.')},
];
export const practiceTitles={bspa:l('BSPA · Mon frigo idéal','BSPA · Mon frigo idéal'),turismo:l('Turismo · La ruta del vino','Tourisme · La route des vins')};
export const stepTitles={
  bspa:[l('¿Qué hay en tu heladera?','Qu’y a-t-il dans ton frigo ?'),l('Alimentos y comercios','Aliments et commerces'),l('Compras en el mercado','Au marché'),l('Algo falta en la heladera','Il manque quelque chose dans le frigo'),l('Tu primera frase','Ta première phrase'),l('Tu heladera, tu presentación','Ton frigo, ta présentation')],
  turismo:[l('Hoy acompañás a un visitante','Aujourd’hui, tu accompagnes un visiteur'),l('Dos territorios, una ruta','Deux territoires, une route'),l('¿Alcanza con parecerse?','Se ressembler, est-ce suffisant ?'),l('Un puente con Salta','Un lien avec Salta'),l('Mirar, oler, describir','Observer, sentir, décrire'),l('Los vinos de altura','Les vins d’altitude'),l('Elegir y justificar','Choisir et justifier'),l('De la uva a la botella','Du raisin à la bouteille'),l('Tu recomendación de viaje','Ta recommandation de voyage'),l('Lo que me dejó la práctica','Ce que la pratique m’a appris')],
};
