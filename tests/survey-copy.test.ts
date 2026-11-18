import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {finalSurveyCopy} from '../src/final-survey-copy.ts';
test('survey choices remain statements in both languages and preserve the five-question structure',()=>{
  for(const words of Object.values(finalSurveyCopy)){
    assert.equal(words.questions.length,5);
    for(const question of words.questions){
      assert.equal(question.options.length,3);
      assert.equal(new Set(question.options).size,3);
      for(const answer of question.options)assert.doesNotMatch(answer,/[¿?]/);
    }
  }
});
