import { AngularSelector, waitForAngular } from 'testcafe-angular-selectors';

fixture `Hello Angular`.page('http://localhost:4200/').beforeEach(async t => {
  await waitForAngular();
});

const rootAngular = AngularSelector();

test('should display welcome message', async t => {
  await t.expect(rootAngular.find('h1').innerText).contains('Welcome');
});

test('has 3 links', async t => {
  await t.expect(rootAngular.find('li a').count).eql(3);
});
