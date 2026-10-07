export const SALE_PHASES = [{id:1,target:87500,price:0.04,tokens:2250000},{id:2,target:75000,price:0.05,tokens:1500000},{id:3,target:87500,price:0.06,tokens:1250000}];
export function saleView(total:number) {
 let previous=0;
 return SALE_PHASES.map(p=>{const raised=Math.max(0,Math.min(p.target,total-previous)); const status=total>=previous+p.target ? "completed" : total>=previous ? "active" : "upcoming"; previous+=p.target;return {...p,raised,status};});
}
export function validSaleAmount(value:string) {return /^\d+(\.\d{0,6})?$/.test(value) && Number(value)>=1 && Number(value)<=10000;}
export function ownSaleRecords(items:any[],address?:string) {return address ? items.filter(item=>String(item.user).toLowerCase()===address.toLowerCase()) : [];}
