import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, saveState, loadState } from '../dist/data.js';
import { contextFor } from '../dist/access.js';
import { authenticateParent, parentContext } from '../dist/parent-login.js';
import { beginFeeCheckout, prepareFeeCard, finishFeeCheckout, feeInvoices, feePaymentMethod } from '../dist/fees-data.js';
import { checkoutView, receiptText } from '../dist/fees.js';
import { portalSubmit } from '../dist/portal-controller.js';
const setup=()=>{const state=freshState(),parent=parentContext(state,authenticateParent(state,'FAMILY-1001','1234')),other=parentContext(state,authenticateParent(state,'FAMILY-1002','1234')),checkout=beginFeeCheckout(state,parent,feeInvoices(state,parent)[0].id);return{state,parent,other,checkout};};
const details=(id,extra={})=>({id,method:'Debit card',cardholder:'DEMO CARDHOLDER',cardNumber:'4242 4242 4242 4242',expiry:'12/30',cvv:'123',...extra});
test('Debit Visa and credit Mastercard complete verification once and retain only masked card summaries',()=>{
 for(const [method,number,brand,last4] of [['Debit card','4242 4242 4242 4242','Visa','4242'],['Credit card','5555 5555 5555 4444','Mastercard','4444']]){
  const{state,parent,checkout}=setup();prepareFeeCard(state,parent,details(checkout.id,{method,cardNumber:number}));assert.deepEqual(checkout.card,{brand,last4});assert.equal(checkout.stage,'verification');assert.ok(!JSON.stringify(state).includes(number));
  const payment=finishFeeCheckout(state,parent,{id:checkout.id,otp:'123456'});assert.equal(payment.method,method);assert.equal(feeInvoices(state,parent)[0].balance,0);assert.equal(finishFeeCheckout(state,parent,{id:checkout.id,otp:'123456'}).id,payment.id);assert.equal(state.feePayments.filter(p=>p.checkoutId===checkout.id).length,1);
  assert.match(receiptText(state,parent,payment.id),new RegExp(brand));assert.match(feePaymentMethod(payment),new RegExp(last4));assert.doesNotMatch(JSON.stringify(state),/"(?:cardNumber|cvv|otp|cardholder|expiry)":/);
 }
});
test('Only fixture cards are accepted; bank, incomplete details and unsupported methods reject atomically',()=>{
 const{state,parent,checkout}=setup(),before=JSON.stringify(state);
 for(const extra of [{method:'Demo bank'},{method:'Bank transfer'},{method:'Demo card'},{cardNumber:'1111 2222 3333 4444'},{cardNumber:'4242a4242 4242 4242'},{cardholder:''},{expiry:'01/20'},{cvv:'456'}]){assert.throws(()=>prepareFeeCard(state,parent,details(checkout.id,extra)));assert.equal(JSON.stringify(state),before);}
 assert.throws(()=>finishFeeCheckout(state,parent,{id:checkout.id,method:'Demo bank',outcome:'cancelled'}));assert.equal(JSON.stringify(state),before);
});
test('OTP and prepared card are required; attempts cannot force a declined fixture into success',()=>{
 const{state,parent,checkout}=setup();assert.throws(()=>finishFeeCheckout(state,parent,{id:checkout.id,otp:'123456'}),/card details/);
 prepareFeeCard(state,parent,details(checkout.id,{cardNumber:'4000 0000 0000 0002'}));const before=JSON.stringify(state);
 assert.throws(()=>finishFeeCheckout(state,parent,{id:checkout.id,otp:'654321'}),/verification code/);assert.throws(()=>finishFeeCheckout(state,parent,{id:checkout.id,otp:'123456',outcome:'success'}),/simulated payment result/);assert.equal(JSON.stringify(state),before);
 finishFeeCheckout(state,parent,{id:checkout.id,otp:'123456'});assert.equal(checkout.status,'declined');assert.equal(state.feePayments.filter(p=>p.checkoutId===checkout.id).length,0);assert.equal(feeInvoices(state,parent)[0].balance,2500000);
});
test('Other families, non-parent staff and revoked appointments cannot authorize or settle a checkout',()=>{
 const{state,parent,other,checkout}=setup(),before=JSON.stringify(state);
 for(const ctx of [other,contextFor(state,'admin','admin_c'),contextFor(state,'principal','principal_c')]){assert.throws(()=>prepareFeeCard(state,ctx,details(checkout.id)));assert.throws(()=>finishFeeCheckout(state,ctx,{id:checkout.id,otp:'123456'}));}assert.equal(JSON.stringify(state),before);
 prepareFeeCard(state,parent,details(checkout.id));state.accounts.find(a=>a.id==='parent').grants=[];const revoked=JSON.stringify(state);assert.throws(()=>finishFeeCheckout(state,parent,{id:checkout.id,otp:'123456'}));assert.equal(JSON.stringify(state),revoked);
});
test('Cancelling before or after card preparation preserves the balance and lets a new checkout start',()=>{
 for(const prepared of [false,true]){const{state,parent,checkout}=setup();if(prepared)prepareFeeCard(state,parent,details(checkout.id));finishFeeCheckout(state,parent,{id:checkout.id,outcome:'cancelled'});assert.equal(checkout.status,'cancelled');assert.equal(feeInvoices(state,parent)[0].balance,2500000);assert.notEqual(beginFeeCheckout(state,parent,checkout.invoiceId).id,checkout.id);}
});
test('Browser persistence and receipts preserve prior payments without saving PAN, CVV or OTP',()=>{
 const{state,parent,checkout}=setup();state.feePayments.push({id:'legacy-bank',method:'Demo bank',amount:10});prepareFeeCard(state,parent,details(checkout.id));const previous=globalThis.localStorage;let stored;globalThis.localStorage={getItem:()=>stored,setItem:(_,value)=>{stored=value;}};
 try{saveState(state);const loaded=loadState();assert.equal(loaded.feePayments.find(p=>p.id==='legacy-bank').method,'Demo bank');assert.equal(feePaymentMethod({method:'Demo bank'}),'Previous payment');assert.deepEqual(loaded.feeCheckouts.find(c=>c.id===checkout.id).card,{brand:'Visa',last4:'4242'});assert.doesNotMatch(stored,/4242 4242 4242 4242|"cvv"|"otp"/);}finally{globalThis.localStorage=previous;}
});
test('All checkout screens are card-only, with brand badges, no file upload and safe verification/result details',()=>{
 const{state,parent,checkout}=setup();for(const step of ['review','card','card-mastercard','card-declined']){const html=checkoutView(state,parent,checkout.id,step);assert.doesNotMatch(html,/bank transfer|confirm-bank|type="file"/i);}
 const card=checkoutView(state,parent,checkout.id,'card');for(const label of ['Debit card','Credit card','aria-label="Visa"','aria-label="Mastercard"','Card number','Expiry date','Security code'])assert.ok(card.includes(label));assert.ok(card.includes('LKR 25,000.00'));
 prepareFeeCard(state,parent,details(checkout.id));assert.match(checkoutView(state,parent,checkout.id,'verify'),/Verification code/);finishFeeCheckout(state,parent,{id:checkout.id,otp:'123456'});assert.match(checkoutView(state,parent,checkout.id),/Payment successful/);assert.doesNotMatch(checkoutView(state,parent,checkout.id),/4242 4242/);
});

test('Leaving the Parent session during processing prevents settlement and another role seeing the result',async()=>{
 const{state,parent,checkout}=setup();prepareFeeCard(state,parent,details(checkout.id));const previous=globalThis.FormData;globalThis.FormData=class extends Map{constructor(){super([['id',checkout.id],['otp','123456']]);}getAll(){return[];}};let writes=0,results=0;
 try{await portalSubmit('portal-checkout',{querySelector:()=>null},{state,ctx:parent,getContext:()=>contextFor(state,'admin','admin_c'),getState:()=>state,update:fn=>{writes++;fn(state);return true;},render:()=>{},showDialog:(_id,title)=>{if(title==='Payment confirmation')results++;},closeDialog:()=>{},toast:()=>{}});assert.equal(writes,0);assert.equal(results,0);assert.equal(checkout.status,'pending');assert.equal(feeInvoices(state,parent)[0].balance,2500000);}finally{globalThis.FormData=previous;}
});
