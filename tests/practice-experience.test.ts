import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {fridgeSentences,guideRecommendation} from '../src/practice-experience-data.ts';

test('the visitor fridge uses only chosen foods and contracts the removed product correctly',()=>{
  const text=fridgeSentences(['lait','eau','tomates'],'eau');
  assert.equal(text.present,'Dans mon frigo, il y a du lait et des tomates.');
  assert.equal(text.absent,'Il n’y a pas d’eau.');
  assert.equal(text.shopping,'Je voudrais une bouteille d’eau.');
  assert.doesNotMatch(text.present,/viande|eau/);
  assert.equal(fridgeSentences(['viande'],'viande').absent,'Il n’y a pas de viande.');
  assert.equal(fridgeSentences([],null).present,'Dans mon frigo, il n’y a rien pour le moment.');
});

test('the guide recommendation preserves the visitor choices without inventing an unchosen wine',()=>{
  const empty=guideRecommendation('cachi','','Humita','');
  assert.match(empty,/Bienvenue à Cachi/);
  assert.doesNotMatch(empty,/Je propose|Malbec|Torrontés/);
  const own=guideRecommendation('cafayate','Malbec','Locro','Parce que le vin accompagne le plat.');
  assert.match(own,/Bienvenue à Cafayate/);
  assert.match(own,/Je propose Malbec pour accompagner Locro/);
  assert.ok(own.endsWith('Parce que le vin accompagne le plat.'));
});
