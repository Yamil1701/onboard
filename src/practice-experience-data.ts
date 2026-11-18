export const fridgeFoods = [
  {id:'lait',icon:'🥛',name:'le lait',partitive:'du lait',negative:'de lait',shopping:'une bouteille de lait'},
  {id:'tomates',icon:'🍅',name:'les tomates',partitive:'des tomates',negative:'de tomates',shopping:'un kilo de tomates'},
  {id:'eau',icon:'💧',name:'l’eau',partitive:'de l’eau',negative:'d’eau',shopping:'une bouteille d’eau'},
  {id:'viande',icon:'🥩',name:'la viande',partitive:'de la viande',negative:'de viande',shopping:'de la viande'},
  {id:'fromage',icon:'🧀',name:'le fromage',partitive:'du fromage',negative:'de fromage',shopping:'du fromage'},
  {id:'pommes',icon:'🍎',name:'les pommes',partitive:'des pommes',negative:'de pommes',shopping:'un kilo de pommes'},
] as const;
export type FoodId=typeof fridgeFoods[number]['id'];
export function frenchList(items:readonly string[]){
  return items.length<2?(items[0]??''):items.slice(0,-1).join(', ')+' et '+items.at(-1);
}
export function fridgeSentences(ids:readonly string[],removed:string|null){
  const foods=fridgeFoods.filter(f=>ids.includes(f.id)&&f.id!==removed);
  const missing=fridgeFoods.find(f=>f.id===removed);
  return {
    present:foods.length?'Dans mon frigo, il y a '+frenchList(foods.map(f=>f.partitive))+'.':'Dans mon frigo, il n’y a rien pour le moment.',
    absent:missing?'Il n’y a pas '+missing.negative+'.':'',
    shopping:missing?'Je voudrais '+missing.shopping+'.':'',
  };
}
export const guideDestinations={
  cafayate:{name:'Cafayate',wine:'Torrontés',colour:'jaune pâle',aroma:'floral',feeling:'frais',altitude:'1 683',visit:'le musée de la Vigne et du Vin',landscape:'la Quebrada de las Conchas'},
  cachi:{name:'Cachi',wine:'Malbec',colour:'rouge rubis',aroma:'fruits rouges',feeling:'intense',altitude:'2 531',visit:'le musée archéologique Pío Pablo Díaz',landscape:'le Nevado de Cachi'},
} as const;
export type GuideDestination=keyof typeof guideDestinations;
export function guideRecommendation(destination:GuideDestination,wine:string,food:string,reason:string){
  const place=guideDestinations[destination];
  return `Bienvenue à ${place.name}, dans les vallées Calchaquíes, dans la province de Salta. On peut découvrir ${place.visit} et admirer ${place.landscape}.`+
    (wine?` Je propose ${wine} pour accompagner ${food}.`:'')+(reason.trim()?' '+reason.trim():'');
}
