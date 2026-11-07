const assert=require('node:assert/strict');
global.window={};
require('../assets/workday-score-audit.js');
const lab=window.WorkdayScoreAudit;
assert.equal(typeof lab.evaluate,'function');
assert.equal(typeof lab.mount,'function');
const good={
  version:1,complete:{1:true,2:true,3:true,4:true,5:true},
  decisions:{
    1:{wellbeing:'truth',delay:'truth'},2:{applicant:'B',privacy:'secure'},
    3:{licences:'protect',risk:'truth'},4:{claim:'truth',proof:'truth',conclusion:'truth',policy:'disclose'},
    5:{evidence:['finance','staff','campaign']}
  }
};
const bad={
  version:1,complete:{1:true,2:true,3:true,4:true,5:true},
  decisions:{
    1:{wellbeing:'spin',delay:'spin'},2:{applicant:'A',privacy:'open'},
    3:{licences:'cut',risk:'spin'},4:{claim:'spin',proof:'spin',conclusion:'spin',policy:'ship'},
    5:{evidence:['finance','staff','leaderboard']}
  }
};
const state={quest:6,won:true,adsDismissed:1};
const g=lab.evaluate(good,state,{integrity:11,heat:0});
const b=lab.evaluate(bad,state,{integrity:0,heat:11});
assert.equal(g.counts.verified,7);
assert.equal(b.counts.verified,0);
assert.equal(g.counts.completed,6);
assert.ok(b.scores.output>g.scores.output,'Management rewards pressure: must critique scoring policy');
assert.ok(g.scores.people>b.scores.people,'Worker model weights conditions');
assert.ok(g.scores.evidence>b.scores.evidence,'Auditor weights verifiable documents');
for(const value of [...Object.values(g.scores),...Object.values(b.scores)]){
  assert.ok(Number.isInteger(value)&&value>=0&&value<=100);
}
const before=JSON.stringify(good);
lab.evaluate(good,state,{integrity:11,heat:0});
assert.equal(JSON.stringify(good),before,'Evaluation must not change completed game records');
const broken=lab.evaluate({decisions:{2:null,5:{evidence:'bad'}}},{quest:100,adsDismissed:-30},{integrity:999,heat:-4});
assert.equal(broken.counts.completed,6);
assert.equal(broken.counts.integrity,11);
assert.equal(broken.counts.pressure,0);
console.log('SCORE_AUDIT_PURE_MODEL_PASS',JSON.stringify({good:g.scores,pressure:b.scores,corruptedSafe:broken.scores}));