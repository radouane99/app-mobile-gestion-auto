(function(root){'use strict';
function route(from,to){const d=root.RouteData,i=d.cities.findIndex(c=>c.id===from),j=d.cities.findIndex(c=>c.id===to);if(i<0||j<0||i===j)return null;const meters=d.distances[i][j];if(!Number.isFinite(meters)||meters<=0)return null;return {from:d.cities[i],to:d.cities[j],km:Math.round(meters/100)/10,backKm:Math.round(d.distances[j][i]/100)/10};}
function measured(d,mode){const cycles=root.AutoCoach.allCycles(d).filter(c=>c.context.mode===mode&&c.km>=100),km=cycles.reduce((s,c)=>s+c.km,0);return cycles.length>=2&&km>=300?{rate:100*cycles.reduce((s,c)=>s+c.liters,0)/km,count:cycles.length,km}:null;}
const api={route,measured};root.RouteLogic=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
