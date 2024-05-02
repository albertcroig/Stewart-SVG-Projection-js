/**
 * @license Stewart.js v1.0.1 17/02/2019
 * https://raw.org/research/inverse-kinematics-of-a-stewart-platform/
 *
 * Copyright (c) 2019, Robert Eisele (robert@raw.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

(function(root) {

  function Animation(platform) {
    this.platform = platform;
    this.orientation = Quaternion.ONE;
    this.translation = [0, 0, 0];

    this.start('wobble');
  }

  Animation.SVG = function(svg, box) {

    var PERSEC = 0.05; // 5units per sec
    var L = 0;
    var H = 0 - 10;

    var SCREEN_SIZE = 80; // 80x80

    var cur = {x: box.width / 2, y: box.height / 2, z: L};
    var ret = [];

    function move(x, y, z) {

      var relX = (x - box.x) / box.width * SCREEN_SIZE - SCREEN_SIZE / 2;
      var relY = (y - box.y) / box.height * SCREEN_SIZE - SCREEN_SIZE / 2;

      var relCurX = (cur.x - box.x) / box.width * SCREEN_SIZE - SCREEN_SIZE / 2;
      var relCurY = (cur.y - box.y) / box.height * SCREEN_SIZE - SCREEN_SIZE / 2;

      ret.push({orig: s.cmd, x: relX, y: relY, z: z, t: Math.hypot(relX - relCurX, relY - relCurY, z - cur.z) / PERSEC});

      cur.x = x;
      cur.y = y;
      cur.z = z;
    }

    var seg = parseSVGPath(svg);

    for (var i = 0; i < seg.length; i++) {

      var s = seg[i];

      switch (s.cmd) {
        case 'move':
          move(cur.x, cur.y, H);
          move(s.x, s.y, H);
          move(s.x, s.y, L);
          break;
        case 'line':
          move(s.x2, s.y2, L);
          break;
        case 'quadratic':
        case 'cubic':
          var b = s.bezier.getLUT();

          for (var j = 0; j < b.length; j++) {
            move(b[j].x, b[j].y, L);
          }
          break;
        case 'arc':

          // https://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
          var x1 = cur.x;
          var y1 = cur.y;

          var x2 = s.x;
          var y2 = s.y;

          var axisRotation = s.axisRotation;
          var largeArcFlag = s.largeArcFlag;
          var sweepFlag = s.sweepFlag;

          var rx = s.rx;
          var ry = s.ry;

          // Step 1: x1', y1'
          var x1_ = Math.cos(axisRotation) * (x1 - x2) / 2.0 + Math.sin(axisRotation) * (y1 - y2) / 2.0;
          var y1_ = -Math.sin(axisRotation) * (x1 - x2) / 2.0 + Math.cos(axisRotation) * (y1 - y2) / 2.0;

          // Step 2: cx', cy'
          var s = (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt((rx * rx * ry * ry - rx * rx * y1_ * y1_ - ry * ry * x1_ * x1_) / (rx * rx * y1_ * y1_ + ry * ry * x1_ * x1_));

          var cx_ = s * rx * y1_ / ry;
          var cy_ = s * -ry * x1_ / rx;

          // Step 3: cx, cy
          var cx = (x1 + x2) / 2.0 + Math.cos(axisRotation) * cx_ - Math.sin(axisRotation) * cy_;
          var cy = (y1 + y2) / 2.0 + Math.sin(axisRotation) * cx_ + Math.cos(axisRotation) * cy_;


          // Step 4:

          var angleBetween = function(ux, uy, vx, vy) {

            var cosPhi = (ux * vx + uy * vy) / Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));

            return (ux * vy < uy * vx ? -1 : 1) * Math.acos(cosPhi);
          };

          // initial angle
          var theta1 = angleBetween(
                  1, 0,
                  (x1_ - cx_) / rx, (y1_ - cy_) / ry);

          // angle delta
          var thetad = angleBetween(
                  (x1_ - cx_) / rx, (y1_ - cy_) / ry,
                  (-x1_ - cx_) / rx, (-y1_ - cy_) / ry);

          if (sweepFlag === 0 && thetad > 0) {
            thetad -= 2 * Math.PI;
          } else if (sweepFlag === 1 && thetad < 0) {
            thetad += 2 * Math.PI;
          }

          var steps = Math.ceil(Math.abs(thetad * Math.max(rx, ry)) / 2); // every two degree
          for (var j = 0; j <= steps; j++) {
            var phi = theta1 + thetad * (j / steps);

            var x = rx * Math.cos(phi);
            var y = ry * Math.sin(phi);

            var x_ = x * Math.cos(axisRotation) - y * Math.sin(axisRotation);
            var y_ = x * Math.sin(axisRotation) + y * Math.cos(axisRotation);

            move(cx + x_, cy + y_, L);
          }
      }
    }
    return Animation.Interpolate(ret);
  };

  Animation.Interpolate = function(data) {

    var duration = 0;
    for (var i = 1; i < data.length; i++) {
      duration += data[i].t;
    }

    return {
      duration: duration,
      pathVisible: true,
      next: null,
      fn: function(pct) {

        this.orientation = Quaternion.ONE;

        var pctStart = 0;

        for (var i = 1; i < data.length; i++) {

          var p = data[i];

          var pctEnd = pctStart + p.t / duration;

          if (pctStart <= pct && pct < pctEnd) {

            var scale = (pct - pctStart) / (pctEnd - pctStart);

            var prev = i === 0 ? data[0] : data[i - 1];

            this.translation[0] = prev.x + (p.x - prev.x) * scale;
            this.translation[1] = prev.y + (p.y - prev.y) * scale;
            this.translation[2] = prev.z + (p.z - prev.z) * scale;

            return;
          }
          pctStart = pctEnd;
        }

        // Set to last element in chain
        this.translation[0] = data[data.length - 1].x;
        this.translation[1] = data[data.length - 1].y;
        this.translation[2] = data[data.length - 1].z;
      },

    };
  };

  Animation.prototype = {
    cur: null,
    next: null,
    startTime: 0,
    platform: null,
    translation: null,
    orientation: null,
    pathVisible: true,
    toggleVisiblePath: function() {
      this.pathVisible = !this.pathVisible;
    },
    drawPath: function(p) {

      if (!this.pathVisible || !this.cur.pathVisible)
        return;

      p.beginShape();
      p.noFill();
      p.stroke(255, 0, 0);
      var steps = 100;
      for (var i = 0; i <= steps; i++) {
        this.cur.fn.call(this, i / steps, p);
        p.vertex(this.translation[0], this.translation[1], this.translation[2] + this.platform.T0[2]);
      }
      p.endShape();
    },
    start: function(t) {

      if (this.map[t]) {
        t = this.map[t];
      }

      if (!this.fn[t]) {
        console.log("Failed ", t);
        return;
      } else {
        this._start(this.fn[t], this.fn[t].next);
      }
    },

    _start: function(play, next) {
      if (play.start) {
        play.start.call(this);
      }
      this.cur = play;
      this.next = next; // Loop
      this.startTime = Date.now();
    },

    moveTo: function(nt, no, time, next) {

      var ot = this.translation.slice();
      var oo = this.orientation.clone();
      var tw = oo.slerp(no);

      this.cur = {
        duration: time,
        pathVisible: false,
        fn: function(pct) {
          this.orientation = tw(pct);
          this.translation = [
            ot[0] + pct * (nt[0] - ot[0]),
            ot[1] + pct * (nt[1] - ot[1]),
            ot[2] + pct * (nt[2] - ot[2])
          ];
        }
      };
      this.startTime = Date.now();
      this.next = next;
    },

    update: function(p) {

      var now = Date.now();

      var elapsed = (now - this.startTime) / this.cur.duration;

      if (elapsed > 1)
        elapsed = 1;

      // Update actual orientation + position
      this.cur.fn.call(this, elapsed, p);

      if (elapsed === 1 && this.cur.duration !== 0 && this.next !== null) {
        this.start(this.next);
      }

      this.platform.update(this.translation, this.orientation);
    },
    fn: {
      rotate: {
        duration: 4000,
        pathVisible: false,
        next: 'rotate',
        fn: function(pct) {
          var b = Math.pow(Math.sin(pct * Math.PI * 2 - Math.PI * 8), 5) / 2;

          this.translation[0] = 0;
          this.translation[1] = 0;
          this.translation[2] = 0;
          this.orientation = Quaternion.fromAxisAngle([0, 0, 1], b);
        }
      },
      tilt: {
        duration: 7000,
        pathVisible: false,
        next: 'tilt',
        fn: function(pct) {

          var a = 0;
          var z = 0;

          if (pct < 1 / 4) {
            pct = pct * 4;
            a = 0;
          } else if (pct < 1 / 2) {
            pct = (pct - 1 / 4) * 4;
            a = 1 * Math.PI / 3;
          } else if (pct < 3 / 4) {
            pct = (pct - 1 / 2) * 4;
            a = 2 * Math.PI / 3;
          } else {
            pct = (pct - 3 / 4) * 4;
            z = 1;
          }

          var x = 0;
          var y = 0;

          if (z === 0) {
            x = Math.sin(a);
            y = -Math.cos(a);
          }

          var b = Math.pow(Math.sin(pct * Math.PI * 2 - Math.PI * 8), 5) / 3;

          this.translation[0] = 0;
          this.translation[1] = 0;
          this.translation[2] = 0;
          this.orientation = Quaternion.fromAxisAngle([x, y, z], b);
        }
      },
      square: (function() {
        var tmp = Animation.Interpolate([
          {x: -30, y: -30, z: 0 + 10, t: 0},
          {x: -30, y: 30, z: 0, t: 1000},
          {x: 30, y: 30, z: +10, t: 1000},
          {x: 30, y: -30, z: 0, t: 1000},
          {x: -30, y: -30, z: 0 + 10, t: 1000},
        ]);
        tmp.next = "square";
        return tmp;
      })(),
      wobble: {
        duration: 3000,
        pathVisible: false,
        next: 'wobble',
        fn: function(pct) {

          var b = pct * 2 * Math.PI;

          this.translation[0] = Math.cos(-b) * 13;
          this.translation[1] = Math.sin(-b) * 13;
          this.translation[2] = 0;
          this.orientation = new Quaternion(-13, -Math.cos(b), Math.sin(b), 0).normalize();
        }
      },
      breathe: {
        duration: 5000,
        pathVisible: false,
        next: 'breathe',
        fn: function(pct) {

          var y = (Math.exp(Math.sin(2 * Math.PI * pct) - 1)) / (Math.E * Math.E - 1);

          this.translation = [0, 0, y * 50];
          this.orientation = Quaternion.ONE;
        }
      },
      eight: {
        duration: 3500,
        pathVisible: true,
        next: 'eight',
        fn: function(pct) {
          var t = (-0.5 + 2.0 * pct) * Math.PI;
          this.translation = [Math.cos(t) * 30, Math.sin(t) * Math.cos(t) * 30, 0];
          this.orientation = Quaternion.ONE;
        }
      },
      lissajous: {
        duration: 10000,
        pathVisible: true,
        next: 'lissajous',
        fn: function(pct) {
          this.translation = [(Math.sin(3 * pct * 2 * Math.PI) * 30), (Math.sin(pct * 2 * 2 * Math.PI) * 30), 0];
          this.orientation = Quaternion.ONE;
        }
      },
      helical: {
        duration: 5000,
        pathVisible: true,
        next: null,
        fn: function(pct) {
          pct = 1 - pct;
          this.translation = [(Math.cos(pct * Math.PI * 8) * 20), (Math.sin(pct * Math.PI * 8) * 20), pct * 20];
          this.orientation = Quaternion.ONE;
        }
      },
      mouse: {
        duration: 0,
        pathVisible: false,
        next: null,
        fn: function(pct, p) {
          this.translation = [(p.mouseX - 512) / 10, (p.mouseY - 382) / 10, 0];
          this.orientation = Quaternion.ONE;
        }
      }, /*
       perlin: (function() {
       
       var xoff = 0;
       var yoff = 0;
       
       
       return {
       duration: 0,
       fn: function(none, p) {
       
       var b = p.noise(xoff, xoff) * 2 * Math.PI;
       
       this.translation[0] = Math.cos(-b) * 13;
       this.translation[1] = Math.sin(-b) * 13;
       this.translation[2] = 0;
       this.orientation = new Quaternion(-13, -Math.cos(b), Math.sin(b), 0).normalize();
       
       
       xoff += 0.0001;
       yoff += 0.0001;
       }
       }
       })(),*/
      gamepad: (function() {

        var gamepadActive = false;
        if (root.addEventListener) {
          root.addEventListener("gamepadconnected", function(e) {
            gamepadActive = true;
          });

          root.addEventListener("gamepaddisconnected", function(e) {
            gamepadActive = false;
          });
        }

        return {
          duration: 0,
          pathVisible: false,
          next: null,
          start: function() {
            this.orientation = Quaternion.ONE;
            this.translation = [0, 0, 0];
            if (gamepadActive) {
              alert("Use the joysticks and L1 button");
            } else {
              alert("Plug in a Playstation or Xbox controller and use the joysticks");
            }
          },
          fn: function() {

            if (!gamepadActive) {
              return;
            }

            var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
            var buttons = gamepads[0].buttons;
            var axes = gamepads[0].axes;

            if (buttons[6].value) { // Is L1 pressed?
              // Rotate around Z axis with joystick 2 left-right
              this.orientation = Quaternion.fromAxisAngle([0, 0, 1], -axes[3] * Math.PI / 6);
              this.translation = [0, 0, 0];
            } else {
              // Control with both joysticks
              var b = Math.atan2(-axes[3], -axes[2]);
              this.translation = [axes[1] * 30, axes[0] * 30, 0];
              this.orientation = new Quaternion(-13, -Math.cos(b), Math.sin(b), 0).normalize();
            }
          }
        };
      })()
    },
    map: {
      q: "square",
      w: "wobble",
      e: "eight",
      r: "rotate",
      t: "tilt",
      y: "lissajous",

      m: "mouse",
      g: "gamepad",
      b: "breathe",
      h: "helical",
      p: "perlin"
    }
  };


  if (typeof exports === "object") {
    Object.defineProperty(exports, "__esModule", {'value': true});
    Stewart['default'] = Stewart;
    Stewart['Stewart'] = Stewart;
    Stewart['Animation'] = Animation;
    module['exports'] = Stewart;
  } else {
    root.Animation = Animation;
    root.Stewart = Stewart;
  }

})(this);
