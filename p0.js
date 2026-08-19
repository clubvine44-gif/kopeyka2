/* Kopeyka 2 - clean app v3 */
(function(){
'use strict';
const KEY='kopeyka2_state_v2';
const MONTHS=['\u042f\u043d\u0432\u0430\u0440\u044c','\u0424\u0435\u0432\u0440\u0430\u043b\u044c','\u041c\u0430\u0440\u0442','\u0410\u043f\u0440\u0435\u043b\u044c','\u041c\u0430\u0439','\u0418\u044e\u043d\u044c','\u0418\u044e\u043b\u044c','\u0410\u0432\u0433\u0443\u0441\u0442','\u0421\u0435\u043d\u0442\u044f\u0431\u0440\u044c','\u041e\u043a\u0442\u044f\u0431\u0440\u044c','\u041d\u043e\u044f\u0431\u0440\u044c','\u0414\u0435\u043a\u0430\u0431\u0440\u044c'];
const WD=['\u043f\u043d','\u0432\u0442','\u0441\u0440','\u0447\u0442','\u043f\u0442','\u0441\u0431','\u0432\u0441'];
const NAV=[
  {id:'calendar',label:'\u041a\u0430\u043b\u0435\u043d\u0434\u0430\u0440\u044c',icon:'\ud83d\udcc5'},
  {id:'income',label:'\u0414\u043e\u0445\u043e\u0434\u044b',icon:'\ud83d\udcb0'},
  {id:'expenses',label:'\u0420\u0430\u0441\u0445\u043e\u0434\u044b',icon:'\ud83e\uddfe'},
  {id:'reserves',label:'\u0420\u0435\u0437\u0435\u0440\u0432\u044b',icon:'\ud83c\udfe6'},
  {id:'debts',label:'\u0414\u043e\u043b\u0433\u0438',icon:'\ud83d\udcc9'},
  {id:'settings',label:'\u0415\u0449\u0451',icon:'\u2699\ufe0f'}
];
function defaultState(){return{version:2,settings:{currentBalance:0,dailyLimitMode:'strict',cyclePattern:['day','day','night','night','off','off'],anchorDate:'2026-08-17',anchorIndex:1,shiftTypes:{day:{label:'\u0414\u043d\u0435\u0432\u043d\u0430\u044f',rate:480000,start:'07:00',end:'19:00'},night:{label:'\u041d\u043e\u0447\u043d\u0430\u044f',rate:480000,start:'19:00',end:'07:00'}},theme:'dark'},income:[],expenses:[],reserves:[],debts:[],recurring:[],reserveOps:[],shiftsOverride:{},notes:[]};}
let STATE=defaultState(),ROUTE='home',VIEW={y:new Date().getFullYear(),m:new Date().getMonth()+1},navOpen=false;
const historyStack=[];
function N(v){return Number(v)||0}
function uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36)}
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function addDays(dateStr,n){const d=new Date(dateStr+'T12:00:00');d.setDate(d.getDate()+n);return d.getFullYear(