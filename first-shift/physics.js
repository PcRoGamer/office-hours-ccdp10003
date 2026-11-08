/* Planck.js adapter: all public coordinates are design pixels. */
(function (global) {
  'use strict';
  const P = global.planck, SCALE = 30;
  if (!P) throw new Error('Planck 1.5.1 must be loaded before physics.js');
  const v = (x, y) => P.Vec2(x / SCALE, y / SCALE);
  class World {
    constructor({gravityX = 0, gravityY = 0, onContact = () => {}} = {}) {
      this.world = new P.World(v(gravityX, gravityY));
      this.ground = this.world.createBody(); this.bodies = []; this.acc = 0; this.joint = null;
      this.world.on('begin-contact', contact => {
        const a = contact.getFixtureA().getBody().getUserData();
        const b = contact.getFixtureB().getBody().getUserData();
        if (a && b) onContact(a, b, contact);
      });
    }
    box(o) { return this._create(o, P.Box(o.w / SCALE / 2, o.h / SCALE / 2)); }
    circle(o) { return this._create(o, P.Circle(o.r / SCALE)); }
    _create(o, shape) {
      const body = this.world.createBody({type: o.kinematic ? 'kinematic' : o.dynamic ? 'dynamic' : 'static', position: v(o.x, o.y), angle: o.angle || 0, linearDamping: o.damping ?? 0.3, angularDamping: o.angularDamping ?? 1, bullet: !!o.bullet, fixedRotation: !!o.fixedRotation});
      body.createFixture(shape, {density: o.density ?? 1, friction: o.friction ?? 0.4, restitution: o.restitution ?? 0.2, isSensor: !!o.sensor});
      const item = {...o, body}; body.setUserData(item); this.bodies.push(item); return item;
    }
    position(item) { const p = item.body.getPosition(); return {x:p.x*SCALE,y:p.y*SCALE,angle:item.body.getAngle()}; }
    setPosition(item,x,y,angle=0) { item.body.setTransform(v(x,y),angle); item.body.setAwake(true); }
    velocity(item,x,y) { item.body.setLinearVelocity(v(x,y)); item.body.setAwake(true); }
    grab(x,y,filter = () => true) {
      this.release(); const point = v(x,y); let picked = null;
      for (let i=this.bodies.length-1;i>=0;i--) { const it=this.bodies[i]; if (!it.dynamic || !filter(it)) continue; for (let f=it.body.getFixtureList();f;f=f.getNext()) if (f.testPoint(point)) { picked=it; break; } if (picked) break; }
      if (!picked) return null;
      this.joint=this.world.createJoint(P.MouseJoint({maxForce:Math.max(4000,4000*picked.body.getMass()), frequencyHz:12, dampingRatio:.85},this.ground,picked.body,point));
      picked.body.setAwake(true); return picked;
    }
    move(x,y) { if (this.joint) this.joint.setTarget(v(x,y)); }
    release() { if (this.joint) { this.world.destroyJoint(this.joint); this.joint=null; } }
    step(dt) { this.acc = Math.min(this.acc + Math.max(0,dt), 0.1); while(this.acc >= 1/60) { this.world.step(1/60,8,3); this.acc -= 1/60; } }
    remove(item) { if (!item || !this.bodies.includes(item)) return; if(this.joint && this.joint.getBodyB()===item.body) this.release(); this.world.destroyBody(item.body); this.bodies.splice(this.bodies.indexOf(item),1); }
    destroy() { this.release(); for (const body of [...this.bodies]) this.remove(body); }
  }
  global.FSPhysics={World,SCALE};
})(window);
