import {l,type Bilingual} from './practice-data';
import type {Language} from './copy';
import {fridgeFoods,fridgeSentences,guideDestinations,guideRecommendation,type FoodId,type GuideDestination} from './practice-experience-data';

type Helpers={
  text:(text:Bilingual)=>string;
  escape:(text:string)=>string;
  image:(file:string,caption:Bilingual,archive?:boolean)=>string;
  legacyBspa:(page:number)=>string;
  legacyTourism:(page:number)=>string;
  choices:(key:string,items:Bilingual[],correct:number,feedback:Bilingual)=>string;
};
export function createPracticeExperience(h:Helpers){
  const t=h.text,e=h.escape;
  let language:Language='ar';
  const foods=new Set<FoodId>();
  let removed:FoodId|null=null,destination:GuideDestination|null=null,wine='',food='Empanada salteña',reason='';
  const button=(action:string,label:Bilingual,extra='')=>`<button type="button" data-practice-action="${action}" ${extra}>${t(label)}</button>`;
  const notes=(content:string,label=l('La práctica de Cyntia · contexto y materiales','La pratique de Cyntia · contexte et supports'))=>`<details class="practice-teacher-notes"><summary>${t(label)}</summary>${content}</details>`;
  const question=(ar:string,fr:string)=>`<div class="experience-question"><p lang="fr">${e(fr)}</p><p>${e(language==='ar'?ar:'À toi de jouer, à ton rythme.')}</p></div>`;
  const mission=(type:'bspa'|'turismo',page:number)=>{
    const bspa=[['Observá y elegí','Observe et choisis'],['Buscá dónde comprar','Trouve le bon commerce'],['Escuchá cómo pedir','Écoute comment commander'],['Algo falta: contalo','Il manque quelque chose : explique-le'],['Ensayá una frase propia','Essaie une phrase personnelle'],['Tu heladera, tu presentación','Ton frigo, ta présentation']];
    const turismo=[['Hoy acompañás a un visitante','Aujourd’hui, tu accompagnes un visiteur'],['Elegí un destino','Choisis une destination'],['Aprendé a reconocer el origen','Apprends à reconnaître l’origine'],['Encontrá un ejemplo cercano','Trouve un exemple local'],['Poné palabras a los sentidos','Mets des mots sur les sens'],['Prepará tu descripción del vino','Prépare ta description du vin'],['Recomendá y explicá por qué','Recommande et explique pourquoi'],['Conectá el proceso con el producto','Relie le procédé au produit'],['Tu recomendación se vuelve folleto','Ta recommandation devient dépliant'],['De tu intento al trabajo del aula','De ton essai au travail de classe']];
    const words=(type==='bspa'?bspa:turismo)[page];
    return `<div class="experience-mission"><span aria-hidden="true">${type==='bspa'?'◌':'↗'}</span><span>${t(l(words[0],words[1]))}</span><small>${type==='bspa'?'Mon frigo idéal':destination?guideDestinations[destination].name:'Route des vins'}</small></div>`;
  };
  function fridge(interactive=true){
    const current=fridgeFoods.filter(f=>foods.has(f.id)&&f.id!==removed);
    return `<div class="fridge-scene"><div class="fridge-label"><span>MON FRIGO</span><span aria-hidden="true">❄</span></div><div class="fridge-interior">${current.length?current.map(f=>`<span class="fridge-product"><span aria-hidden="true">${f.icon}</span><small lang="fr">${e(f.partitive)}</small></span>`).join(''):`<p>${t(l('Todavía está vacía. Elegí productos para empezar.','Il est encore vide. Choisis des produits pour commencer.'))}</p>`}</div>${removed?`<p class="fridge-missing"><span aria-hidden="true">${fridgeFoods.find(f=>f.id===removed)!.icon}</span> ${t(l('Este producto falta ahora','Ce produit manque maintenant'))}</p>`:''}</div>`+
      (interactive?`<div class="fridge-groceries" role="group" aria-label="${t(l('Elegí alimentos para tu heladera','Choisis les aliments de ton frigo'))}">${fridgeFoods.map(f=>button('fridge-toggle',l(f.name,f.name),`data-food="${f.id}" aria-pressed="${foods.has(f.id)&&f.id!==removed}" class="fridge-food"`)).join('')}</div>`:'');
  }
  function removeFood(){
    const available=fridgeFoods.filter(f=>foods.has(f.id));
    return question('Sacá un producto de la heladera. ¿Cómo contarías que ya no está?','Retire un produit du frigo. Comment dire qu’il n’y en a plus ?')+fridge(false)+
      (available.length?`<div class="fridge-groceries" role="group" aria-label="${t(l('Elegí el producto que falta','Choisis le produit manquant'))}">${available.map(f=>button('fridge-remove',l('Sacar '+f.name,'Retirer '+f.name),`data-food="${f.id}" aria-pressed="${removed===f.id}"`)).join('')}</div>`:fridge(true))+
      (removed?`<blockquote lang="fr">${e(fridgeSentences([...foods],removed).absent)}</blockquote>`:`<p class="experience-hint">${t(l('Primero elegí qué producto vas a sacar.','Choisis d’abord le produit à retirer.'))}</p>`);
  }
  function phraseWorkshop(){
    const sentences=fridgeSentences([...foods],removed);
    const sample=fridgeFoods.find(f=>foods.has(f.id)&&f.id!==removed);
    const options=['du','de la','de l’','des'];
    const correct=sample?(sample.partitive.startsWith('du ')?0:sample.partitive.startsWith('de la ')?1:sample.partitive.startsWith('de l’')?2:3):0;
    return question('Ahora juntá lo aprendido y contá cómo quedó tu heladera.','Maintenant, utilise ce que tu as appris pour présenter ton frigo.')+fridge(true)+
      (sample?`<p class="practice-target" lang="fr">Il y a ___ ${e(sample.id)}.</p>`+h.choices('fridge-partitive-'+sample.id,options.map(x=>l(x,x)),correct,l('Con este alimento decimos « '+sample.partitive+' ».','Avec cet aliment, on dit « '+sample.partitive+' ».')):'')+
      (foods.size?`<section class="experience-output" aria-live="polite"><p class="practice-eyebrow">${t(l('Tu ensayo en francés','Ton essai en français'))}</p><p lang="fr">${e(sentences.present)}</p>${sentences.absent?`<p lang="fr">${e(sentences.absent)}</p><p lang="fr">${e(sentences.shopping)}</p>`:''}</section>`:'')+
      `<p class="experience-hint">${t(l('Podés cambiar los productos. Tu frase se arma con tus elecciones.','Tu peux changer les produits. Ta phrase se construit avec tes choix.'))}</p>`;
  }
  function destinationPicker(){
    return `<div class="guide-route-choices" role="group" aria-label="${t(l('Elegí el destino de tu visitante','Choisis la destination du visiteur'))}">${(Object.entries(guideDestinations) as [GuideDestination,typeof guideDestinations[GuideDestination]][]).map(([id,place])=>button('guide-destination',l(place.name,place.name),`data-destination="${id}" aria-pressed="${destination===id}" class="guide-destination"`)).join('')}</div>`+
      (destination?`<div class="guide-route-summary" role="status"><strong>${e(guideDestinations[destination].name)}</strong><span>${t(l('Tu recorrido pasa por este destino. Después elegirás qué recomendar.','Ton parcours passe par cette destination. Tu choisiras ensuite quoi recommander.'))}</span></div>`:'');
  }
  function guideWine(){
    const picked=destination?guideDestinations[destination]:null;
    return `<section class="guide-task"><p class="practice-eyebrow">${t(l('La recomendación de tu visitante','La recommandation pour ton visiteur'))}</p>${question('Elegí el vino que querés presentar y reconocé su color.','Choisis le vin que tu veux présenter et reconnais sa couleur.')}<div class="guide-route-choices">${['Malbec','Torrontés'].map(name=>button('guide-wine',l(name,name),`data-wine="${name}" aria-pressed="${wine===name}"`)).join('')}</div>${picked?`<p>${t(l('Para '+picked.name+', la ficha de clase propone '+picked.wine+'. Podés explorar ambas fichas.','Pour '+picked.name+', la fiche de cours propose le '+picked.wine+'. Tu peux explorer les deux fiches.'))}</p>`:''}</section>`;
  }
  function visitorBrochure(){
    if(!destination)return question('Elegí Cachi o Cafayate para armar tu recomendación.','Choisis Cachi ou Cafayate pour construire ta recommandation.')+destinationPicker();
    const place=guideDestinations[destination];
    return `<section class="visitor-brochure"><p class="practice-eyebrow">${t(l('Tu ensayo como guía','Ton essai en tant que guide'))}</p><h3>${e(place.name)}</h3><p class="brochure-subtitle">Vallées Calchaquíes · Salta</p><div class="brochure-route"><span aria-hidden="true">⌖</span><span>${e(place.visit)}</span><span aria-hidden="true">→</span><span>${e(place.landscape)}</span></div><p lang="fr">${e(guideRecommendation(destination,wine,food,reason))}</p><p class="brochure-signoff">${t(l('Una recomendación construida con tus elecciones.','Une recommandation construite avec tes choix.'))}</p></section>`;
  }
  function render(type:'bspa'|'turismo',page:number){
    let content='';
    if(type==='bspa'){
      switch(page){
        case 0:content=question('Abrimos la heladera. ¿Qué te gustaría tener y qué falta?','On ouvre le frigo. Qu’aimerais-tu y trouver ? Que manque-t-il ?')+fridge()+`<p class="experience-hint">${t(l('Elegí productos tocándolos. Vas a usarlos a lo largo de esta pequeña clase.','Touche les produits pour les choisir. Tu vas les utiliser tout au long de ce petit cours.'))}</p>`+notes(h.legacyBspa(0));break;
        case 3:content=removeFood()+`<details><summary>${t(l('Practicar la regla y comprobar una respuesta','Pratiquer la règle et vérifier une réponse'))}</summary>${h.legacyBspa(3)}</details>`;break;
        case 4:content=phraseWorkshop()+`<details><summary>${t(l('Seguir practicando con las actividades de clase','Continuer avec les activités de cours'))}</summary>${h.legacyBspa(4)}</details>`;break;
        case 5:content=`<p class="experience-intro">${t(l('Lo que elegiste al empezar ahora se convierte en una pequeña presentación. Leela en voz alta si te animás.','Tes choix de départ deviennent maintenant une petite présentation. Lis-la à voix haute si tu le souhaites.'))}</p>`+phraseWorkshop()+`<blockquote lang="fr">Et toi, qu’est-ce qu’il y a dans ton frigo ?</blockquote>`+notes(h.legacyBspa(5));break;
        default:content=h.legacyBspa(page);
      }
    }else{
      switch(page){
        case 0:content=`<div class="guide-invitation"><small>ROUTE DES VINS</small><h3>${t(l('Hoy sos quien acompaña el viaje.','Aujourd’hui, c’est toi qui accompagnes le voyage.'))}</h3><p>${t(l('Un visitante quiere conocer los vinos y paisajes de Salta. Elegí un destino, descubrí qué lo hace especial y prepará tu recomendación.','Un visiteur veut découvrir les vins et les paysages de Salta. Choisis une destination, découvre sa singularité et prépare ta recommandation.'))}</p></div>`+destinationPicker()+notes(h.legacyTourism(0));break;
        case 1:content=question('Ubicá tu destino en la Ruta del Vino y elegí por dónde acompañarías al visitante.','Repère ta destination sur la Route des vins et choisis où accompagner le visiteur.')+h.image('mapas/01.webp',l('Salta · La ruta que vamos a recorrer','Salta · Le parcours à découvrir'),true)+destinationPicker()+notes(h.legacyTourism(1),l('Comparar los mapas de Francia y Salta','Comparer les cartes de France et de Salta'));break;
        case 5:content=guideWine()+h.legacyTourism(5);break;
        case 8:content=visitorBrochure()+`<p class="experience-hint">${t(l('Este es tu ensayo. A continuación podés mirar cómo resolvieron la tarea los estudiantes.','C’est ton essai. Tu peux maintenant découvrir comment les étudiants ont réalisé la tâche.'))}</p>`+notes(h.legacyTourism(8),l('Ver las producciones reales de estudiantes','Voir les productions réelles des étudiants'));break;
        case 9:content=visitorBrochure()+h.legacyTourism(9);break;
        default:content=h.legacyTourism(page);
      }
    }
    return mission(type,page)+content;
  }
  function action(target:HTMLButtonElement){
    switch(target.dataset.practiceAction){
      case 'fridge-toggle':{
        const id=target.dataset.food as FoodId;if(!fridgeFoods.some(f=>f.id===id))return false;
        if(foods.has(id)&&removed!==id)foods.delete(id);else foods.add(id);
        if(removed===id)removed=null;return true;
      }
      case 'fridge-remove':removed=target.dataset.food as FoodId;return true;
      case 'guide-destination':destination=target.dataset.destination as GuideDestination;return true;
      case 'guide-wine':wine=target.dataset.wine!;return true;
      default:return false;
    }
  }
  return {
    render,action,
    translate(lang:Language){language=lang;},
    input(target:HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement){
      // Pairing is a personal recommendation; preserve it without marking it right or wrong.
      if(target.dataset.practiceInput==='pair-wine'){
        const options=target instanceof HTMLSelectElement?target.selectedOptions:undefined;
        wine=target.value?options?.[0]?.textContent??'':'';
      }
      if(target.dataset.practiceInput==='pair-reason')reason=target.value;
    },
    setPairingFood(value:string){food=value;wine='';reason='';},
    reset(){foods.clear();removed=null;destination=null;wine='';food='Empanada salteña';reason='';},
  };
}
