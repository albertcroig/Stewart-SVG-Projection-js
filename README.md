# Stewart Platform - Project SVG onto wall

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

This is a project for Ontwerp Production Technology (Odisee), as a bachelor thesis.

[Stewart Platforms](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/) are used for motion platforms with six dimensions of freedom. This is a modification of the original Stewart-js repository by Robert Eisele, where you could simulate Stewart Platforms as well as use the calculated angles to drive a real platform.

This software is based on the idea of attaching a laser pointer into a Stewart Platform, so that it moves with it. That way, the laser will point to wherever the platform moves. With some trigonometry, the translation and rotation of the platform can be calculated in order to achieve a projection of whatever shape we want onto a wall.

The main functionality that has been modified is the SVG drawing. In Robert Eisele's library, there is an SVG renderer that can read SVG paths and transform them into a series of movements for the platform. However, it could only draw the shapes in the horizontal plane, right on top of the platform. With the mentioned objective of projecting the SVG's onto the wall, some tweaks and implementations have been made to the source code.


## Visualization

![Stewart-Platform](https://github.com/albertcroig/Stewart.js/blob/development/res/graphical-interface.png?raw=true "Stewart Platform Visualization")

An important addition to the original source code is the graphical interface. Several options to control the characteristics of the animation, as well as the platform have been implemented.

```js
<script src="p5.js"></script>
<script src="quaternion.js"></script>
<script src="stewart.js"></script>
<script>
var sketch = function(p) {

  p.setup = function() {
    p.createCanvas(600, 600, p.WEBGL);

    p.camera(100.0, -290.0, (p.height / 2.0) / Math.tan(Math.PI / 6),
            0.0, 0.0, 0.0,
            0.0, 1.0, 0.0);

    platform = new Stewart;
    platform.initHexagonal(/*{ options }*/);
  };

  p.draw = function() {

    p.background(255);

    p.push();

    p.translate(50, -70, 200);
    p.rotateX(Math.PI / 2); // Work in correct X-Y-Z plane

    // Set correct position where to drive to
    platform.update([0, 0, 0], Quaternion.ONE);

    // Draw the updated platform
    platform.draw(p);

    // Send to servos
    // platform.getServoAngles();

    p.pop();
  };
};
new p5(sketch, 'canvas');
</script>
```

## Examples

In the examples folder are use cases documented.

### Default

The default example can be controlled via key presses on letters from a-z on the keyboard. Not all letters have a function. 

![Stewart-Platform](https://github.com/rawify/Stewart.js/blob/master/res/stewart-platform-helix.png?raw=true "Stewart Platform Helix Plot")

Here is a list:

- q: Skewed square
- w: wobble
- e: eight
- r: rotate
- t: tilt
- y: lissajous
- m: mouse control
- g: Gamepad control, using Gamepad Web API
- b: Simulation of breath
- h: Helical animation

### SVG Plotter

SVG paths are parsed and used for motion commads. This way SVG images can be plotted with a Stewart platform by attaching a pen:

![Stewart-Platform](https://github.com/rawify/Stewart.js/blob/master/res/stewart-platform-github.png?raw=true "Stewart Platform Github Plot")



### LeapMotion

The hand tracking device LeapMotion can be read via JavaScript using the leapjs package. The example uses the LeapMotion to use the hand position and orienttion as input for the platform.



## Options

The platform visualization is meant to draw a platform in milimeter. When you work headless, the unit does not matter. The following options are available:

### rodLength

The length of the rod attached to the servo horn and the platform. Default=130

### hornLength

The length of the servo horn attached to the motor shaft and the rod. Default=50

### hornDirection

The horn direction indicates if the servo horn is rotated to the left or to the right. 0=right, 1=left, Default=0

### servoRange

A valid range for the servo motors to rotate. A typical low-cost servo has 180° working space. The value is an array [minAngle, maxAngle]. Default=[-pi/2, pi/2]

### servoRangeVisible

A boolean if the servo range should be visible in the drawing. Default=false

### baseRadius + baseRadiusOuter

When a hexagonal stewart platform is used, the `baseRadiusOuter` is used to draw the base plate in accordance to the [description](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/).

### platformRadius + platformRadiusOuter

When a hexagonal stewart platform is used, the `platformRadiusOuter` is used to draw the platform plate in accordance to the [description](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/).

### shaftDistance + ankerDistance

For a circular platform this indicates the radial distance of pairs of rod ankers between the shafts on the base plate and the platform plate. For hexagonal platforms this indicates the distance from the middle of a side to attach the rod ankers. Default=20

### platformTurn

A boolean for hexagonal platforms to indicate if the platform shall look into the same direction as the base plate. Default=true



## Installation

Installing Stewart is as easy as cloning this repo or use one of the following command:

```
npm install stewart
```




Copyright and licensing
===
Copyright (c) 2023, [Robert Eisele](https://raw.org/)
Licensed under the MIT license.
