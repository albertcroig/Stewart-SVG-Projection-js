# Stewart Platform - Project SVG onto wall

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

This project is the result of my Bachelor Thesis, for Odisee - Ontwerp Production Technology.

[Stewart Platforms](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/) are used for motion platforms with six dimensions of freedom. This is a modification of the original Stewart.js repository by Robert Eisele, where you could simulate Stewart Platforms as well as use the calculated angles to drive a real platform.

This software is based on the idea of attaching a laser pointer into a Stewart Platform, so that it moves with it. That way, the laser will point to wherever the platform moves. With some trigonometry, the translation and rotation of the platform can be calculated in order to achieve a projection of whatever shape we want onto a wall.

The main functionality that has been modified is the SVG drawing. In Robert Eisele's library, there is an SVG renderer that can read SVG paths and transform them into a series of movements for the platform. However, it could only draw the shapes in the horizontal plane, right on top of the platform. With the mentioned objective of projecting the SVG's onto the wall, some tweaks and implementations have been made to the source code.


## Display

![Stewart-Platform](https://github.com/albertcroig/Stewart.js/blob/development/res/graphical-interface.png?raw=true "Stewart Platform Visualization")

An important addition to the original source code is the graphical interface. Several options to control the characteristics of the animation and platform, as well as other useful implementations have been added.

Check the demo on the [live github page](https://albertcroig.github.io/Stewart.js/) to give it a try.

There are three main sections on the browser display.

1. On the top section are located the loaded SVG's (that can be clicked to run their corresponding animation), as well as the current angles for the servo motors (in radians and degrees). 
2. On the left part there's the simulation of the platform.
3. On the right part there's a set of options and functionalities related to the animation and the servo angles.

## Modifications and implementations

As stated before, this project is focused on the SVG drawing part of the original software, that way, most of the original features have been removed (predefined animations, xbox controller, etc.)

### Stewart platform behaviour and simulation

The visualization of the simulation has been changed in order to see its projections onto the wall and enhance user-interaction. These are the following additions:

Platform
- Letters (x,y,z) for both axes (platform and base).
- Every servo labeled with its corresponding number.
- A "ball" attached to a red line coming from the platform's coordinate origin to represent the center-point of platform's rotation.
- A violet laser pointing towards the wall.

Wall
- Spherical wall in a light brown color, positioned according to the "wall distance" and scaled according to the "rotation axis offset".
- In the center of the wall, the selected SVG will be drawn. The user has the option to see the end-result or to see the drawing process live (not recommended in slow or old machines, since it takes more processing memory).

Camera
- Option of switching the view to different pre-defined camera-angles.

### Functions available in the browser

Live display of servo angles and laser-state:
A small window on the top-right of the screen shows real-time values of the angle of each servo-motor, as well as the state of the laser (on/off). When any of the servos is out of the predefined range of angles, it shows as "Out of range".

Convert text to SVG:
Enter any text and it will be automatically scaled and converted to an SVG, and the animation will be run on the simulation side.
- There are two types of fonts: regular font and hand-drawing like font.
- To force a line break, enter the character "\" in between the words where you want it to happen.
- Press enter or click the "Draw" button in order to run the animation.
- Once the text is entered, it will be shown in the Loaded SVG's section for later use.

Warning: This functionality does not support accents and some special characters.



Tweak paramaters:

Change camera position:

Servo angles of current animation:


### Files and organization

Since the lines of code have been greatly increased, I opted for splitting the original file (stewart.js) into two different ones: "animation.js" and "platform.js". Each containing the corresponding object information and its functions.

Visualization and interaction with the display is splitted in three files: "default.html" (structure and info of the browser), "style.css" (styling and formatting) and "main.js" (logic). The basic functionality is taken from the "default.html" file in the original repo.

Apart from those, I found it suitable to add one more file, that takes care of the Text to SVG functionality.



### Visual modifications


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
