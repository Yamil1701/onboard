import type {Language} from './copy';

type Slide={eyebrow:string;title:string;intro:string;ideas:readonly (readonly [string,string])[];closing:string};
export const reportSlides:Record<Language,readonly Slide[]>={
  ar:[
    {eyebrow:'El punto de partida',title:'Planificar para un grupo real',intro:'Una clase empieza por conocer a quienes aprenden: sus saberes, intereses, ritmos y condiciones de estudio.',ideas:[['Conocer','Observar y escuchar antes de decidir.'],['Dar sentido','Vincular el francés con situaciones cercanas y propósitos concretos.'],['Anticipar','Preparar consignas claras, apoyos y un recorrido posible.']],closing:'La planificación orienta; el grupo le da su forma.'},
    {eyebrow:'Las decisiones didácticas',title:'Aprender francés para comunicarse',intro:'El vocabulario y la gramática cobran sentido cuando permiten pedir, describir, recomendar e intercambiar con otros.',ideas:[['Ofrecer apoyos','Imágenes, modelos y guías para comprender y animarse a participar.'],['Ensayar juntos','El trabajo en parejas abre más oportunidades para hablar.'],['Producir y revisar','Pasar de una respuesta guiada a una producción propia, con devolución.']],closing:'La evaluación acompaña el proceso y ayuda a volver a intentar.'},
    {eyebrow:'Desvíos y descubrimientos',title:'Ajustar también es enseñar',intro:'Los tiempos, las preguntas y las necesidades del aula pueden cambiar el recorrido previsto.',ideas:[['Priorizar','Elegir lo esencial y reservar tiempo para producir y ensayar.'],['Verificar','Consultar un apoyo antes de confirmar una respuesta incierta.'],['Dar continuidad','Reorganizar una tarea y decidir cómo seguir cuando el tiempo no alcanza.']],closing:'Revisar una decisión permite mejorar la siguiente clase.'},
    {eyebrow:'Lo que deja la práctica',title:'También aprendemos al enseñar',intro:'Volver sobre lo ocurrido permite reconocer avances, dificultades y decisiones que vale la pena sostener o cambiar.',ideas:[['Mantener','Los modelos visibles, las guías y el trabajo entre compañeros.'],['Transformar','Las actividades demasiado cargadas y los tiempos para la producción oral.'],['Seguir aprendiendo','Prepararse, escuchar y reconocer el error como una oportunidad de revisión.']],closing:'Enseñar es planificar, escuchar y ajustar.'},
  ],
  fr:[
    {eyebrow:'Le point de départ',title:'Préparer pour un groupe réel',intro:'Un cours commence par la connaissance des apprenants : leurs savoirs, leurs intérêts, leurs rythmes et leurs conditions d’étude.',ideas:[['Connaître','Observer et écouter avant de décider.'],['Donner du sens','Relier le français à des situations proches et à des objectifs concrets.'],['Anticiper','Préparer des consignes claires, des aides et un parcours réalisable.']],closing:'La préparation oriente ; le groupe lui donne sa forme.'},
    {eyebrow:'Les choix didactiques',title:'Apprendre le français pour communiquer',intro:'Le vocabulaire et la grammaire prennent leur sens lorsqu’ils permettent de demander, décrire, recommander et échanger.',ideas:[['Proposer des aides','Des images, des modèles et des guides pour comprendre et oser participer.'],['Répéter ensemble','Le travail en binômes offre davantage d’occasions de parler.'],['Produire et reprendre','Passer d’une réponse guidée à une production personnelle, avec un retour.']],closing:'L’évaluation accompagne le parcours et permet de réessayer.'},
    {eyebrow:'Détours et découvertes',title:'Adapter, c’est aussi enseigner',intro:'Le temps, les questions et les besoins de la classe peuvent modifier le parcours prévu.',ideas:[['Prioriser','Choisir l’essentiel et garder du temps pour produire et répéter.'],['Vérifier','Consulter un support avant de confirmer une réponse incertaine.'],['Poursuivre','Réorganiser une tâche et décider comment continuer lorsque le temps manque.']],closing:'Revoir une décision permet d’améliorer le cours suivant.'},
    {eyebrow:'Les apprentissages du stage',title:'En enseignant, nous apprenons aussi',intro:'Revenir sur le vécu permet de reconnaître les progrès, les difficultés et les choix à conserver ou à modifier.',ideas:[['Conserver','Les modèles visibles, les guides et le travail entre pairs.'],['Transformer','Les activités trop chargées et le temps réservé à la production orale.'],['Continuer à apprendre','Se préparer, écouter et considérer l’erreur comme une occasion de révision.']],closing:'Enseigner, c’est préparer, écouter et adapter.'},
  ],
};

export function renderReportSlide(index:number,language:Language){
  const slide=reportSlides[language][index];
  const article=document.createElement('article');article.className='report-summary-slide';article.lang=language==='ar'?'es':'fr';
  const p=(className:string,text:string)=>{const el=document.createElement('p');el.className=className;el.textContent=text;return el;};
  article.append(p('report-summary-kicker',slide.eyebrow));
  const heading=document.createElement('h3');heading.id='report-summary-heading';heading.tabIndex=-1;heading.textContent=slide.title;article.append(heading);
  article.append(p('report-summary-intro',slide.intro));
  const list=document.createElement('ul');list.className='report-summary-ideas';
  for(const [title,description]of slide.ideas){const item=document.createElement('li'),strong=document.createElement('strong'),text=document.createElement('span');strong.textContent=title;text.textContent=description;item.append(strong,text);list.append(item);}
  article.append(list,p('report-summary-closing',slide.closing));
  const footer=document.createElement('footer');footer.className='report-summary-footer';
  footer.append(p('report-summary-position',`${language==='ar'?'Síntesis general':'Synthèse générale'} · ${index+1} / ${reportSlides[language].length}`));
  if(index===reportSlides[language].length-1){const button=document.createElement('button');button.type='button';button.dataset.reportAction='full';button.textContent=language==='ar'?'Leer informe completo':'Lire le rapport complet';footer.append(button);}
  article.append(footer);
  return article;
}
