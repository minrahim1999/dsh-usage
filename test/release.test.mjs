import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('public release manifest is explicitly bounded and renamed',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url)));
 assert.equal(p.name,'dsh-usage');assert.equal(p.version,'0.1.0');
 assert.equal(p.private,true);assert.equal(p.license,'MIT');
 assert.deepEqual(p.files,['client.js','src/','cordis.patch.yml','README.md','CHANGELOG.md','examples/']);
});
