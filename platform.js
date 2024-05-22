/**
 * @license Stewart.js v1.0.1 17/02/2019
 * https://raw.org/research/inverse-kinematics-of-a-stewart-platform/
 *
 * Copyright (c) 2019, Robert Eisele (robert@raw.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/

// Constructor function for the stewart platform object. 
function Stewart() {
}

Stewart.prototype = {

  // Function to initialize the stewart platform
  init: function(opts) {

    // Set initial parameters for the Stewart platform
    this.rodLength = opts.rodLength;
    this.hornLength = opts.hornLength;
    this.hornDirection = opts.hornDirection;
    this.drawBasePlate = opts.drawBasePlate;
    this.drawPlatformPlate = opts.drawPlatformPlate;
    this.drawWall = opts.drawWall;
    this.servoRange = opts.servoRange;
    this.servoRangeVisible = opts.servoRangeVisible;
    this.laserPlatformEdge = opts.laserPlatformEdge;
    this.wallDistance = opts.wallDistance;
    this.rotationAxisOffset = opts.rotationAxisOffset;

    // Initialize arrays to store base and platform joints, sinBeta, cosBeta, q, l, and H
    this.B = [];       // base joints in base frame
    this.P = [];       // platform joints in platform frame
    this.q = [];       // vector from base origin to Pk
    this.l = [];       // vector from B to P
    this.H = [];       // servo horn end to mount the rod
    this.sinBeta = []; // Sin of Pan angle of motors in base plate
    this.cosBeta = []; // Cos of Pan angle of motors in base plate
    
    // Get the legs configuration using the provided function
    var legs = opts.getLegs.call(this);

    // Initialize arrays based on the legs configuration
    for (var i = 0; i < legs.length; i++) {
      this.B.push(legs[i].baseJoint);
      this.P.push(legs[i].platformJoint);
      this.sinBeta.push(Math.sin(legs[i].motorRotation));
      this.cosBeta.push(Math.cos(legs[i].motorRotation));
      this.q.push([0, 0, 0]);
      this.l.push([0, 0, 0]);
      this.H.push([0, 0, 0]);
    }

    // Set the initial offset T0 based on absolute height or rod and horn lengths
    if (opts.absoluteHeight) {
      this.T0 = [0, 0, 0];
    } else {
      // Relative height measure formula on paper: z = sqrt(d^2+h^2-(px-bx)^2-(py-by)^2)
      this.T0 = [0, 0, Math.sqrt(this.rodLength * this.rodLength + this.hornLength * this.hornLength
                - Math.pow(this.P[0][0] - this.B[0][0], 2)
                - Math.pow(this.P[0][1] - this.B[0][1], 2))];
    }

  },

  drawPartialSphere: function(p, radius, startAngle, endAngle, color) {
    p.strokeWeight(0.05)
    p.fill(color)
    p.beginShape(p.TRIANGLE_STRIP);
    for (let phi = startAngle; phi <= endAngle; phi += 0.1) {
      for (let theta = 0; theta <= p.TWO_PI; theta += 0.1) {
        let x = radius * p.sin(phi) * p.cos(theta);
        let y = radius * p.sin(phi) * p.sin(theta);
        let z = radius * p.cos(phi);
        p.vertex(x, y, z);
        
        x = radius * p.sin(phi + 0.1) * p.cos(theta);
        y = radius * p.sin(phi + 0.1) * p.sin(theta);
        z = radius * p.cos(phi + 0.1);
        p.vertex(x, y, z);
      }
      // Add the final vertex to close the shape
      let x = radius * p.sin(phi) * p.cos(0);
      let y = radius * p.sin(phi) * p.sin(0);
      let z = radius * p.cos(phi);
      p.vertex(x, y, z);
      
      x = radius * p.sin(phi + 0.1) * p.cos(0);
      y = radius * p.sin(phi + 0.1) * p.sin(0);
      z = radius * p.cos(phi + 0.1);
      p.vertex(x, y, z);
    }
    p.endShape();
  },

  // This function is called once from the html script in the p.setup() function.
  // This function initializes the Stewart platform with a hexagonal configuration, defining the base and platform geometry along with other parameters.
  // It also uses the init function to set up the common configuration for the Stewart platform.
  initHexagonal: function(opts) {

    // Set default values if opts is not provided
    if (!opts)
      opts = {};

    // Define parameters for the hexagonal configuration
    var baseRadius = opts.baseRadius || 196/2; // 10cm
    var baseRadiusOuter = opts.baseRadiusOuter || 140; // 14cm
    var platformRadius = opts.platformRadius || 221.64/2; // 221.64/2cm
    var platformRadiusOuter = opts.platformRadiusOuter || 150.11/2; // 150.11/2cm

    // If opts.platformTurn is undefined, set platformTurn to true; otherwise, set it to the value of opts.platformTurn
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator
    var platformTurn = opts.platformTurn === undefined ? false : opts.platformTurn;

    var rodLength = opts.rodLength || 130;          // 13 cm length of the rod connected to servo
    var hornLength = opts.hornLength || 40;         // 4 cm length of servo
    var hornDirection = opts.hornDirection || 0;    // 0 beta angle of servo

    var shaftDistance = opts.shaftDistance || 45/2;   // 4.5cm Distance between servos fixing points on base on each side
    var anchorDistance = opts.anchorDistance || 45/2; // 4cm Distance between servos fixing points on platform on each side

    // Generate points for the hexagonal base plate and platform plate
    var baseInts = getHexPlate(baseRadius, baseRadiusOuter, 0);  // Base vertices
    var platformInts = getHexPlate(platformRadius, platformRadiusOuter, platformTurn ? Math.PI : 0);  // Platform vertices

    // Define servo range and visibility
    var servoRange = opts.servoRange || [-Math.PI/3, Math.PI/3];
    var servoRangeVisible = opts.servoRangeVisible === undefined ? false : opts.servoRangeVisible;
    
    // Offset of rotation axis and wall distance (from center of platform).
    var rotationAxisOffset = (opts.rotationAxisOffset !== undefined) ? opts.rotationAxisOffset : 250;
    
    var wallDistance = (opts.wallDistance !== undefined) ? opts.wallDistance : 820;
    var laserPlatformEdge = {};

    // Find platform edge where laser's going to be pointing
    laserPlatformEdge.x = (platformInts[1].x)
    laserPlatformEdge.y = 0

    // Execute init function with specific opts argument as anonymous object for hexagonal configuration
    this.init({
      rodLength: rodLength,
      hornLength: hornLength,
      hornDirection: hornDirection,
      servoRange: servoRange,
      servoRangeVisible: servoRangeVisible,
      laserPlatformEdge: laserPlatformEdge,
      wallDistance: wallDistance,
      rotationAxisOffset: rotationAxisOffset,
      getLegs: function() { // Define getLegs function for hexagonal configuration
        var legs = [];
        var basePoints = [];
        var platPoints = [];
        var motorAngle = [];

        // For every leg (from i=0 to i=5)
        for (var i = 0; i < 6; i++) {

          var midK = i | 1;  // Get the next odd number from i. ex: if i=0, then midK=1, i=2:midK=3
          var baseCx = baseInts[midK].x;  // Get x value of one of the vertex of the base
          var baseCy = baseInts[midK].y;  // Get y value of one of the vertex of the base
          var baseNx = baseInts[(midK + 1) % 6].x;  // Get x value of the next vertex
          var baseNY = baseInts[(midK + 1) % 6].y;  // Get y value of the next vertex

          // Do the same with the platform
          var platCx = platformInts[midK].x;
          var platCy = platformInts[midK].y;
          var platNx = platformInts[(midK + 1) % 6].x;
          var platNY = platformInts[(midK + 1) % 6].y;

          var baseDX = baseNx - baseCx; // Subtract current vertex and next vertex to get X Length of base side
          var baseDY = baseNY - baseCy; // Subtract current vertex and next vertex to get Y Length of base side

          // Math.hypot method: https://www.w3schools.com/python/ref_math_hypot.asp#:~:text=The%20math.,x%20%2B%20y*y).
          var lenBaseSide = Math.hypot(baseDX, baseDY); // Total length of base side

          var pm = Math.pow(-1, i); //(-1)^i, if i=0, pm=1, otherwise pm=-1

          var baseMidX = (baseCx + baseNx) / 2; // Get X midpoint of the base side
          var baseMidY = (baseCy + baseNY) / 2; // Get Y midpoint of the base side

          var platMidX = (platCx + platNx) / 2; // Get X midpoint of the platform side
          var platMidY = (platCy + platNY) / 2; // Get Y midpoint of the platform side

          baseDX /= lenBaseSide; // calculate cos(alpha) or sin(alpha), depending on the angle          
          baseDY /= lenBaseSide; // calculate cos(alpha) or sin(alpha), depending on the angle          

          // calculate base and platform points 
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
      drawBasePlate: function(p) { // Called periodically, draw the plate of the platform using the base vertex retrieved with getHexPlate
        p.stroke(0);
        p.fill(0xFE, 0xF1, 0x35);

        p.beginShape();
        for (var i = 0; i < baseInts.length; i++) {
          p.vertex(baseInts[i].x, baseInts[i].y);
        }
        p.endShape(p.CLOSE);
      },
      drawPlatformPlate: function(p) { // Called periodically, draw the plate of the platform using the base vertex retrieved with getHexPlate
        p.stroke(0);
        p.fill(0x2A, 0xEC, 0xFD);

        p.beginShape();
        for (var i = 0; i < platformInts.length; i++) {
          p.vertex(platformInts[i].x, platformInts[i].y);
        }
        p.endShape(p.CLOSE);

        // Draw laser pointer
        p.push()
        p.stroke(238,130,238)
        p.translate(laserPlatformEdge.x, 0);
        p.line(0, 0, wallDistance-laserPlatformEdge.x, 0);
        p.pop()

        // Draw line to center of rotation
        p.push()
        p.stroke(255,0,0)
        p.line(0, 0, -rotationAxisOffset, 0);
        p.pop()        

        // Draw little black sphere to represent rotation axis
        p.push()
        p.translate(-rotationAxisOffset,0,0)
        p.sphere(2)
        p.pop()


      },
      drawWall: function(p) {

        // Drawing spherical wall
        p.push()
        p.translate(-rotationAxisOffset,0,this.T0[2])
        p.rotateY(p.PI/2)
        this.drawPartialSphere(p, (rotationAxisOffset+wallDistance + 1), 0, Math.PI/6, [221, 216, 187])
        p.pop()

        // Drawing floor cube
        p.fill(100)
        p.stroke(0)
        p.rectMode(p.CENTER)
        
        p.push()
        p.fill(200)
        p.translate(0,0,-0.01)
        p.rotateZ(Math.PI/2)
        p.rect(0,0, 400, 400)
        p.push()
        p.translate(200, 0)
        p.rotateY(-Math.PI/2)
        p.rect(-200,0,400,400)
        p.pop()
        p.push()
        p.translate(-200, 0)
        p.rotateY(-Math.PI/2)
        p.rect(-200,0,400,400)
        p.pop()
        p.push()
        p.translate(-200, 200)
        p.rotateX(-Math.PI/2)
        p.rect(200,200,400,400)
        p.pop()
        p.pop()
      },
    });
  },
  // This function is called from the main html script, on the draw function. So it's called continuously.
  // Draw the coordinate system axes and also draw the base plate and the platform plate, as well as all other objects:
  // legs, base joints, platform joints.
  draw: (function() {

    // Defining the function to draw a cone, used later for the cooridnate axes.
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

    // Defining the function to draw the frame: containing the 3 lines and the 3 cones.
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
      p.translate(-3,-2,1)
      //p.rotateZ(Math.PI/2)
      p.fill(0)
      p.text('x',0,0)
      p.pop();

      // Green Cone
      p.push();
      p.noStroke();
      p.fill(0, 255, 0);
      p.rotateX(-Math.PI);
      p.translate(0, -w - ch, 0);
      drawCone(p, 3, ch);
      p.translate(-2,-5,-1)
      p.scale(-1,1)
      p.rotateZ(-Math.PI/2)
      p.fill(0)
      p.text('y',0,0)
      p.pop();

      // Blue Cone
      p.push();
      p.noStroke();
      p.fill(0, 0, 255);
      p.rotateX(-Math.PI / 2);
      p.translate(0, -w - ch, 0);
      drawCone(p, 3, ch);
      p.translate(0,0,-1)
      p.rotateY(Math.PI/2)
      p.scale(-1,1)
      p.fill(0)
      p.text('z',-2,-4)
      p.pop();
    }

    // Using a return function to define the statements of draw, not necessary.
    return function(p) {

      // Base Frame
      drawFrame(p);

      // Base plate
      p.push();
      this.drawBasePlate(p);
      this.drawWall(p)

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

        // Servo numbers
        p.rotateZ(Math.PI/2)
        switch (i) {
          case 0:
          case 1:
            p.text(i,10,0)
            break;
          case 2:
          case 3:
            p.text(i,0,20)
            break
          case 4:
          case 5:
            p.text(i,-10,-5)
            break           
        }
        
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
  // It's called by the function animation.update() from the animation object. And this function is called constantly because
  // it's located in the draw function in the main html script. 
  // Updates the position of the elements in the system, based on the translation and orientation calculated by the animation object.
  update: function(translation, orientation) {

    var hornLength = this.hornLength;
    var rodLength = this.rodLength;

    var q = this.q;     // vector from base origin to Pk
    var l = this.l;     // vector from B to P
    var B = this.B;     // base joints in base frame
    var P = this.P;     // platform joints in platform frame
    var H = this.H;     // servo horn end to mount the rod
    var z = this.T0[2]; // Initial offset

    this.translation = translation;
    this.orientation = orientation;
   
    // Calculate H, q and l
    for (var i = 0; i < B.length; i++) {

      // Performing a quaternion rotation based on orientation to vector pk (see paper)
      var o = orientation.rotateVector(P[i]);

      // Simplifying variable names so they can be referenced faster
      var li = l[i];
      var qi = q[i];
      var Hi = H[i];
      var Bi = B[i];

      // Vector from base origin to Pk (platform joint), using formula in paper: qk = T + R x pk x R(conjugate)
      qi[0] = translation[0] + o[0];      // x value
      qi[1] = translation[1] + o[1];      // y value
      qi[2] = translation[2] + o[2] + z;  // z value

      // Vector from B to P (from base anchor to platform anchor), using formula in paper: lk = qk - bk = T + R x pk x R(conjugate) - bk
      li[0] = qi[0] - Bi[0];
      li[1] = qi[1] - Bi[1];
      li[2] = qi[2] - Bi[2];

      // Calculating parameters from the trigonometric identity, see paper. Where d = rodLength and h = hornLength
      var gk = li[0] * li[0] + li[1] * li[1] + li[2] * li[2] - rodLength * rodLength + hornLength * hornLength;
      var ek = 2 * hornLength * li[2];
      var fk = 2 * hornLength * (this.cosBeta[i] * li[0] + this.sinBeta[i] * li[1]);

      // Applying last formulas
      var sqSum = ek * ek + fk * fk;
      var sqrt1 = Math.sqrt(1 - gk * gk / sqSum);
      var sqrt2 = Math.sqrt(sqSum);
      var sinAlpha = (gk * ek) / sqSum - (fk * sqrt1) / sqrt2;
      var cosAlpha = (gk * fk) / sqSum + (ek * sqrt1) / sqrt2;

      // Calculate endpoint of sevo horn that intersects with servo rod.
      Hi[0] = Bi[0] + hornLength * cosAlpha * this.cosBeta[i];
      Hi[1] = Bi[1] + hornLength * cosAlpha * this.sinBeta[i];
      Hi[2] = Bi[2] + hornLength * sinAlpha;
    }
  },

  // While not necessary for the execution of the visual representation, this function is strictly essential if we want
  // to work with a real prototype, since the only variable we are going to enter to the servos is the value of their rotation.
  // This calculates each of the angles the servos have to rotate to accomplish a specific position of the horn edge (H), 
  // using basic trigonometric functions described in the paper.
  getServoAngles: function(translation) {
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
 
    if (translation[3] === 1) {
      ret.push(1)
    }
    else {
      ret.push(0)
    }
    //ret.push(this.translation[2])
    
    return ret;
  }
};

