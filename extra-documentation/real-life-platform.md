# Guide to making a real-life Stewart Platform replicate the simulation software movements

This software's main function is to simulate a real-life stewart platform with cheap servos, and convert a sequence of angles for an animation to pulses for said servos. 

To the extent of having the expected results, we need two things:
- Precise measurements of the platform's dimensions, so that the simulation is as close as possible to reality.
- A good calibration of the servos to match their pulses with the real angles.

## How to correctly measure the platform's parameters
As described in the platform options section inside the [README file](/README.md), several parameters constitute the platform's integrity. In the software, these parameters are used to virtually recreate the simplest version of the platform. However, when we move to a real-life platform, it can be easy to get confused on how to get the correct measurements.

To note the differences, look at the following pictures, showing a platform with the same dimensions both in real life and in the simulation:

<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/development/res/platform-comparison.jpg?raw=true" width="400">
</p>

### Radii of platform and base

The main measuring difficulty resides on the size of both the base and the platform. We need to know the inner radious and outer radious of the circles tangent to the triangles that compose them. Check [Robert Eisele's paper](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/) for more details.

In the simulation, it's easy to see that the anchor points (both on the base and platform) are attached right into them. Nonetheless, in the real version there's an acknowledgeable distance between the platform/base and the and the anchor points. We are interested in finding out the radius of the cercles that constitute the triangles going through those anchor points. 

Knowing that, it is clear that the circles to find for the real platform are:

<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/development/res/radii.jpg?raw=true" width="400">
</p>

Both the base and the platform are defined by 2 radii, one for the 'inner' triangle and another one for the "outer" triangle, both of them together constitute their characteristic hexagonal shape.

The radius of interest here is the red-colored one, defined as R1. It needs to be calculated precisely, since the position of the anchor points depends on it. 

R2 will only have a visual impact on the simulation, since it will not affect the behaviour of the platform, nor the resulting servo angles. It will have to be larger than the radius of the cercle tangent to the purple lines, in order to prevent the anchor points from "freely floating".

**Measuring R1**

The easiest way to measure R1, is to do so when designing the platform in a 3D design software, such as SolidWorks or AutoCAD. However, when brought into real life, it's important to re-measure it, since there's always room for error and the radii could differ slightly.

To measure it in real life, we use a caliper to get the lengths between two anchor points. Using the color code, we should get the "red" length and the "purple" length. Once we have them, we can sketch the resulting hexagon in a 2D drawing software, such as AutoCAD, knowing that the angle between sides is 60º, and finally draw a cercle tangent to the 3 red lines.

*Important note: To correctly measure the base's radius, it's important that all of the servos are aligned with the same rotation angle.*

The following picture shows how I did it with the example Stewart Platform:

<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/development/res/radii-autocad.png?raw=true" width="400">
</p>



## How to measure the calibration values of the servos

## Issues that remain unsolved to this date

    - skewing of image when large size
    - only integer values accepted in cheap servos
    - calibration data hard to get precisely
    - only 2 or 3 animations accepted at the same time (memory issues)
    - number of steps limited to 2056 (memory issues)