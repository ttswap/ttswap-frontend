const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {mkdtempSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');const {join,resolve}=require('node:path');const {buildSync}=require('esbuild');
const temp=mkdtempSync(join(tmpdir(),'ttswap-sale-tests-'));
buildSync({entryPoints:[resolve(__dirname,'../src/utils/saleView.ts')],bundle:true,platform:'node',format:'cjs',outfile:join(temp,'view.cjs'),logLevel:'silent'});
const {saleView,validSaleAmount,ownSaleRecords}=require(join(temp,'view.cjs'));
after(()=>rmSync(temp,{recursive:true,force:true}));
test('completed boundaries advance to next stage; full sale never stays active',()=>{
 assert.equal(saleView(0).find(p=>p.status==='active').id,1);
 assert.equal(saleView(87499).find(p=>p.status==='active').id,1);
 assert.equal(saleView(87500).find(p=>p.status==='active').id,2);
 assert.equal(saleView(162500).find(p=>p.status==='active').id,3);
 for(const amount of [250000,300000]){assert.equal(saleView(amount).filter(p=>p.status==='active').length,0);assert.equal(saleView(amount).reduce((s,p)=>s+p.raised,0),250000);}
});
test('purchase rejects invalid numbers and overprecision before unit conversion',()=>{
 for(const value of ['1','10000','1.000001','42.50'])assert.ok(validSaleAmount(value),value);
 for(const value of ['','0','-1','0.999999','10000.000001','1.0000001','1e3','Infinity','NaN','abc'])assert.ok(!validSaleAmount(value),value);
});
test('my records never include another wallet, case-insensitive match',()=>{
 const rows=[{id:1,user:'0xAbC'},{id:2,user:'0xdef'},{id:3,user:'0xabc'}];
 assert.deepEqual(ownSaleRecords(rows,'0xABC').map(r=>r.id),[1,3]);assert.deepEqual(ownSaleRecords(rows,undefined),[]);assert.deepEqual(ownSaleRecords(rows,'0xother'),[]);
});
