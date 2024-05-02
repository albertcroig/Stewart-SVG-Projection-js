/**
 * @license Stewart.js v1.0.1 17/02/2019
 * https://raw.org/research/inverse-kinematics-of-a-stewart-platform/
 *
 * Copyright (c) 2019, Robert Eisele (robert@raw.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/


function Stewart() {}

Stewart.prototype = {
  translation: null,
  orientation: null,

  drawBasePlate: null,
  drawPlatformPlate: null,

  rodLength: 0,
  hornLength: 0,
  hornDirection: 0,
  servoRange: null,
  servoRangeVisible: false,

  sinBeta: [], // Sin of Pan angle of motors in base plate
  cosBeta: [], // Cos of Pan angle of motors in base plate
  B: [], // base joints in base frame
  P: [], // platform joints in platform frame

  q: [], // vector from base origin to Pk
  l: [], // vector from B to P
  H: [], // servo horn end to mount the rod

  T0: [], // Initial offset

  init: function(opts) {

    this.rodLength = opts.rodLength;
    this.hornLength = opts.hornLength;
    this.hornDirection = opts.hornDirection;
    this.drawBasePlate = opts.drawBasePlate;
    this.drawPlatformPlate = opts.drawPlatformPlate;
    this.servoRange = opts.servoRange;
    this.servoRangeVisible = opts.servoRangeVisible;

    this.B = [];
    this.P = [];
    this.q = [];
    this.l = [];
    this.H = [];
    this.sinBeta = [];
    this.cosBeta = [];

    var legs = opts.getLegs.call(this);

    for (var i = 0; i < legs.length; i++) {
      this.B.push(legs[i].baseJoint);
      this.P.push(legs[i].platformJoint);
      this.sinBeta.push(Math.sin(legs[i].motorRotation));
      this.cosBeta.push(Math.cos(legs[i].motorRotation));
      this.q.push([0, 0, 0]);
      this.l.push([0, 0, 0]);
      this.H.push([0, 0, 0]);
    }

    if (opts.absoluteHeight) {
      this.T0 = [0, 0, 0];
    } else {
      this.T0 = [0, 0, Math.sqrt(this.rodLength * this.rodLength + this.hornLength * this.hornLength
                - Math.pow(this.P[0][0] - this.B[0][0], 2)
                - Math.pow(this.P[0][1] - this.B[0][1], 2))];
    }

  },
  initCircular: function(opts) {

    if (!opts)
      opts = {};

    var baseRadius = opts.baseRadius || 80; // 8cm
    var platformRadius = opts.platformRadius || 50; // 5cm

    // Circle segment s = alpha_deg / 180 * pi * R <=> alpha_deg = s / R / pi * 180 <=> alpha_rad = s / R
    var shaftDistance = (opts.shaftDistance || 20) / baseRadius;
    var anchorDistance = (opts.anchorDistance || 20) / baseRadius;

    var rodLength = opts.rodLength || 130;

    var hornLength = opts.hornLength || 50;
    var hornDirection = opts.hornDirection || 0;

    var servoRange = opts.servoRange || [-Math.PI / 2, Math.PI / 2];
    var servoRangeVisible = opts.servoRangeVisible === undefined ? false : opts.servoRangeVisible;

    this.init({
      rodLength: rodLength,
      hornLength: hornLength,
      hornDirection: hornDirection,
      servoRange: servoRange,
      servoRangeVisible: servoRangeVisible,
      getLegs: function() {

        var legs = [];
        for (var i = 0; i < 6; i++) {

          var pm = Math.pow(-1, i);
          var phiCut = (1 + i - i % 2) * Math.PI / 3;

          var phiB = (i + i % 2) * Math.PI / 3 + pm * shaftDistance / 2;
          var phiP = phiCut - pm * anchorDistance / 2;

          legs.push({
            baseJoint: [Math.cos(phiB) * baseRadius, Math.sin(phiB) * baseRadius, 0],
            platformJoint: [Math.cos(phiP) * platformRadius, Math.sin(phiP) * platformRadius, 0],
            motorRotation: phiB + ((i + hornDirection) % 2) * Math.PI + Math.PI / 2
          });
        }
        return legs;
      },
      drawBasePlate: function(p) {
        p.stroke(0);
        p.fill(0xFE, 0xF1, 0x35);
        p.ellipse(0, 0, 2 * baseRadius, 2 * baseRadius);
      },
      drawPlatformPlate: function(p) {
        p.stroke(0);
        p.fill(0x2A, 0xEC, 0xFD);
        p.ellipse(0, 0, 2 * platformRadius, 2 * platformRadius);
      }
    });
  },

  initHexagonal: function(opts) {

    if (!opts)
      opts = {};

    var baseRadius = opts.baseRadius || 80; // 8cm
    var baseRadiusOuter = opts.baseRadiusOuter || 110; // 11cm

    var platformRadius = opts.platformRadius || 50; // 5cm
    var platformRadiusOuter = opts.platformRadiusOuter || 80; // 8cm
    var platformTurn = opts.platformTurn === undefined ? true : opts.platformTurn;

    var rodLength = opts.rodLength || 130;

    var hornLength = opts.hornLength || 50;
    var hornDirection = opts.hornDirection || 0;

    var shaftDistance = opts.shaftDistance || 20;
    var anchorDistance = opts.anchorDistance || 20;

    var baseInts = getHexPlate(baseRadius, baseRadiusOuter, 0);
    var platformInts = getHexPlate(platformRadius, platformRadiusOuter, platformTurn ? Math.PI : 0);

    var servoRange = opts.servoRange || [-Math.PI / 2, Math.PI / 2];
    var servoRangeVisible = opts.servoRangeVisible === undefined ? false : opts.servoRangeVisible;

    this.init({
      rodLength: rodLength,
      hornLength: hornLength,
      hornDirection: hornDirection,
      servoRange: servoRange,
      servoRangeVisible: servoRangeVisible,
      getLegs: function() { // Called once at setup
        var legs = [];
        var basePoints = [];
        var platPoints = [];
        var motorAngle = [];

        for (var i = 0; i < 6; i++) {

          var midK = i | 1;
          var baseCx = baseInts[midK].x;
          var baseCy = baseInts[midK].y;
          var baseNx = baseInts[(midK + 1) % 6].x;
          var baseNY = baseInts[(midK + 1) % 6].y;

          var platCx = platformInts[midK].x;
          var platCy = platformInts[midK].y;
          var platNx = platformInts[(midK + 1) % 6].x;
          var platNY = platformInts[(midK + 1) % 6].y;

          var baseDX = baseNx - baseCx;
          var baseDY = baseNY - baseCy;
          var lenBaseSide = Math.hypot(baseDX, baseDY);

          var pm = Math.pow(-1, i);

          var baseMidX = (baseCx + baseNx) / 2;
          var baseMidY = (baseCy + baseNY) / 2;

          var platMidX = (platCx + platNx) / 2;
          var platMidY = (platCy + platNY) / 2;

          baseDX /= lenBaseSide;
          baseDY /= lenBaseSide;

          basePoints.push([baseMidX + baseDX * shaftDistance * pm, baseMidY + baseDY * shaftDistance * pm, 0]);
          platPoints.push([platMidX + baseDX * anchorDistance * pm, platMidY + baseDY * anchorDistance * pm, 0]);
          motorAngle.push(Math.atan2(baseDY, baseDX) + ((i + hornDirection) % 2) * Math.PI);
        }

        var platformIndex = [0, 1, 2, 3, 4, 5];

        if (platformTurn) {
          platformIndex = [4, 3, 0, 5, 2, 1];
        }

        for (var i = 0; i < basePoints.length; i++) {
          legs.push({
            baseJoint: basePoints[i],
            platformJoint: platPoints[platformIndex[i]],
            motorRotation: motorAngle[i]
          });
        }

        return legs;
      },
      drawBasePlate: function(p) { // Called periodically
        p.stroke(0);
        p.fill(0xFE, 0xF1, 0x35);

        p.beginShape();
        for (var i = 0; i < baseInts.length; i++) {
          p.vertex(baseInts[i].x, baseInts[i].y);
        }
        p.endShape(p.CLOSE);
      },
      drawPlatformPlate: function(p) { // Called periodically
        p.stroke(0);
        p.fill(0x2A, 0xEC, 0xFD);

        p.beginShape();
        for (var i = 0; i < platformInts.length; i++) {
          p.vertex(platformInts[i].x, platformInts[i].y);
        }
        p.endShape(p.CLOSE);
      }
    });
  },

  draw: (function() {

    function drawCone(p, radius, h) {

      var sides = 12;
      var angle = 0;
      var angleIncrement = 2 * Math.PI / sides;
      p.beginShape(p.TRIANGLE_STRIP);
      for (var i = 0; i <= sides; i++) {
        p.vertex(0, 0, 0);
        p.vertex(radius * Math.cos(angle), h, radius * Math.sin(angle));
        angle += angleIncrement;
      }
      p.endShape();

      angle = 0;
      p.beginShape(p.TRIANGLE_FAN);

      p.vertex(0, h, 0);
      for (var i = 0; i < sides + 1; i++) {
        p.vertex(radius * Math.cos(angle), h, radius * Math.sin(angle));
        angle += angleIncrement;
      }
      p.endShape();
    }

    function drawFrame(p) {

      var w = 40;
      var ch = 10; // cone head

      // Draw 3 lines
      p.push();
      p.strokeWeight(2);
      p.stroke(255, 0, 0); // rot=x
      p.line(0, 0, 0, w, 0, 0);
      p.stroke(0, 255, 0); // grün=y
      p.line(0, 0, 0, 0, w, 0);
      p.stroke(0, 0, 255); // blau=z
      p.line(0, 0, 0, 0, 0, w);
      p.pop();

      // Red Cone
      p.push();
      p.noStroke();
      p.fill(255, 0, 0);
      p.rotateZ(Math.PI / 2);
      p.translate(0, -w - ch, 0);
      drawCone(p, 3, ch);
      p.pop();

      // Green Cone
      p.push();
      p.noStroke();
      p.fill(0, 255, 0);
      p.rotateX(-Math.PI);
      p.translate(0, -w - ch, 0);
      drawCone(p, 3, ch);
      p.pop();

      // Blue Cone
      p.push();
      p.noStroke();
      p.fill(0, 0, 255);
      p.rotateX(-Math.PI / 2);
      p.translate(0, -w - ch, 0);
      drawCone(p, 3, ch);
      p.pop();
    }

    return function(p) {

      // Base Frame
      drawFrame(p);

      // Base plate
      p.push();
      this.drawBasePlate.call(this, p);

      // Platform plate
      p.translate(this.translation[0], this.translation[1], this.translation[2] + this.T0[2]);

      p.applyMatrix.apply(p, this.orientation.conjugate().toMatrix4());

      this.drawPlatformPlate.call(this, p);

      // Platform Frame
      drawFrame(p);
      p.pop();

      for (var i = 0; i < this.B.length; i++) {
        // Base Joints
        p.push();
        p.translate(this.B[i][0], this.B[i][1], this.B[i][2]);
        p.noStroke();
        p.fill(0);
        p.sphere(3);
        p.pop();

        // Platform Joints
        p.push();
        p.translate(this.q[i][0], this.q[i][1], this.q[i][2]);
        p.noStroke();
        p.fill(255, 0, 0);
        p.sphere(3);
        p.pop();

        // A -> q rods
        p.push();
        p.stroke(255, 0, 0);
        p.strokeWeight(1);
        p.line(this.H[i][0], this.H[i][1], this.H[i][2], this.q[i][0], this.q[i][1], this.q[i][2]);
        //p.pop();

        // Base -> A rods
        //p.push();
        p.stroke(0);
        // p.strokeWeight(1);
        p.line(this.B[i][0], this.B[i][1], this.B[i][2], this.H[i][0], this.H[i][1], this.H[i][2]);
        p.pop();

        if (this.servoRangeVisible) {
          p.push();
          p.translate(this.B[i][0], this.B[i][1], this.B[i][2]);
          p.rotateX(Math.PI / 2);
          p.rotateY(Math.atan2(this.H[i][1] - this.B[i][1], this.H[i][0] - this.B[i][0]));
          p.fill('rgba(255,0,0,0.1)');
          p.noStroke();
          p.arc(0, 0, 2 * this.hornLength, 2 * this.hornLength, this.servoRange[0], this.servoRange[1], p.PIE);
          p.pop();
        }
      }
    };

  })(),

  update: function(translation, orientation) {

    var hornLength = this.hornLength;
    var rodLength = this.rodLength;

    var q = this.q;
    var l = this.l;
    var B = this.B;
    var P = this.P;
    var H = this.H;
    var z = this.T0[2];

    this.translation = translation;
    this.orientation = orientation;

    // Calculate H, q and l
    for (var i = 0; i < B.length; i++) {

      var o = orientation.rotateVector(P[i]);

      var li = l[i];
      var qi = q[i];
      var Hi = H[i];
      var Bi = B[i];

      qi[0] = translation[0] + o[0];
      qi[1] = translation[1] + o[1];
      qi[2] = translation[2] + o[2] + z;

      li[0] = qi[0] - Bi[0];
      li[1] = qi[1] - Bi[1];
      li[2] = qi[2] - Bi[2];

      var gk = li[0] * li[0] + li[1] * li[1] + li[2] * li[2] - rodLength * rodLength + hornLength * hornLength;
      var ek = 2 * hornLength * li[2];
      var fk = 2 * hornLength * (this.cosBeta[i] * li[0] + this.sinBeta[i] * li[1]);

      var sqSum = ek * ek + fk * fk;
      var sqrt1 = Math.sqrt(1 - gk * gk / sqSum);
      var sqrt2 = Math.sqrt(sqSum);
      var sinAlpha = (gk * ek) / sqSum - (fk * sqrt1) / sqrt2;
      var cosAlpha = (gk * fk) / sqSum + (ek * sqrt1) / sqrt2;

      Hi[0] = Bi[0] + hornLength * cosAlpha * this.cosBeta[i];
      Hi[1] = Bi[1] + hornLength * cosAlpha * this.sinBeta[i];
      Hi[2] = Bi[2] + hornLength * sinAlpha;
    }
  },

  getServoAngles: function() {

    var ret = [];
    for (var i = 0; i < this.B.length; i++) {
      ret[i] = Math.asin((this.H[i][2] - this.B[i][2]) / this.hornLength);
      if (isNaN(ret[i])) {
        // Rod too short
        ret[i] = null;
      } else if (!(this.servoRange[0] <= ret[i] && ret[i] <= this.servoRange[1])) {
        // Out of range
        ret[i] = null;
      }

    }
    return ret;
  }

};

