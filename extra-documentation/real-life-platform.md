# Guide to Making a Real-Life Stewart Platform Replicate the Simulation Software Movements

This software's primary function is to simulate a real-life Stewart platform using cheap servos and convert a sequence of angles for an animation into pulses for these servos.

To achieve the expected results, we need two key things:
- **Precise measurements of the platform's dimensions:** This ensures the simulation closely matches reality.
- **Proper calibration of the servos:** This aligns their pulses with the actual angles.

## How to Correctly Measure the Platform's Parameters
As described in the platform options section of the [README file](/README.md), several parameters are essential to the platform's integrity. In the software, these parameters virtually recreate the simplest version of the platform. However, for the real-life platform, it can be challenging to obtain accurate measurements.

To understand the differences, refer to the following pictures showing a platform with the same dimensions both in real life and in the simulation:

<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/master/res/platform-comparison.jpg?raw=true" width="800">
</p>

### Radii of Platform and Base

The primary measuring challenge lies in determining the size of both the base and the platform. We need to know the inner radius and outer radius of the circles tangent to the triangles that compose them. Check [Robert Eisele's paper](https://raw.org/research/inverse-kinematics-of-a-stewart-platform/) for more details.

In the simulation, it's easy to see that the anchor points (both on the base and platform) are attached directly to them. However, in the real version, there is a noticeable distance between the platform/base and the anchor points. We are interested in finding out the radius of the circles that define the triangles passing through those anchor points.

Thus, the circles to find for the real platform are:

<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/master/res/radii.jpg?raw=true" width="800">
</p>

Both the base and the platform are defined by two radii: one for the 'inner' triangle and another for the 'outer' triangle, together forming their characteristic hexagonal shape.

The radius of interest here is the red-colored one, defined as R1. It needs to be calculated precisely since the position of the anchor points depends on it.

**R2** will only have a visual impact on the simulation and will not affect the behavior of the platform or the resulting servo angles. It should be larger than the radius of the circle tangent to the purple lines to prevent the anchor points from "floating."

**Measuring R1**

The easiest way to measure R1 is during the design of the platform in a 3D design software, such as SolidWorks or AutoCAD. However, when constructing the platform in real life, it's important to re-measure it, as there is always room for error, and the radii could differ slightly.

To measure it in real life, use a caliper to get the lengths between two anchor points. Using the color code, measure the "red" length and the "purple" length. Once you have these measurements, you can sketch the resulting hexagon in a 2D drawing software, such as AutoCAD, knowing that the angle between sides is 60º. Finally, draw a circle tangent to the three red lines.

*Important note: To correctly measure the base's radius, ensure that all of the servos are aligned with the same rotation angle.*

The following picture shows how this can be done with the example Stewart Platform:

<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/master/res/radii-autocad.png?raw=true" width="800">
</p>

Now that we have the radii, it's important to input them correctly into the code to ensure the simulated platform's configuration matches the real platform's. Depending on how we construct the platform, we may need to switch the values of `platformRadius` and `outerPlatformRadius`, as well as toggle `platformTurn`.

### Rest of Parameters

The measurement of the rest of the platform's parameters is straightforward, as there is practically no difference between the simulation and the real-life platform.

However, here's a quick guide on how to measure them:

<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/master/res/measure-platform-params.jpg?raw=true" width="500">
</p>

For detailed instructions on how to set these parameters in the code, refer to the platform options section in the [README](/README.md) file.

## How to measure the calibration values of the servos

Servo motors do not recognize angles as an input; they are controlled through pulses. Fortunately, the relationship between the angles and the pulses is linear.

### 1. Get the slope

1) **Disassemble servos:** If you have the platform already assembled, you will need to disassemble the servos from it, in order to properly calibrate them.

2) **Prepare calibration tool:** Attach the servo to the calibration tool and start the measurements.
*The calibration tool used is nothing more than a protractor with a hole in the midde attached to a wooden rod (broad enough so that the servo will stay in the middle). Then the servo is placed under the tool and finally secured by a gripper.* Here's a descriptive image of the tool:
<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/master/res/calibration-tool.JPEG?raw=true" width="300">
</p>

3) **Take measurements:** With the servo connected to COSMOS software, control the servo from the software and write down at least 5 values of the angle shown in the protractor and the pulse shown in the software. *Check the template [excel file](/extra-documentation/Servo_Calibration.xlsx) and type in the values for your own calibration.* When typing all the values, the servo can be represented with a function like the following:
<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/master/res/servo-pulse-to-angle-graph.jpg?raw=true" width="500">
</p>

5) **Annotate the slope**: From these points, the relationship between the pulse and the angle can be found through linear regression. We'll only need the annotate slope (m) of the function.

6) **Repeat for All Servos**: Perform the above steps for all servos.

### 2. Get the Middle Point

Once we have the slope of each servo, the final step is to calibrate their middle position. Here’s how to do it:

1) **Reassemble the Stewart Platform:** Put each of the servos in their corresponding position, keeping in mind that they need to be as centered as possible.

2) **Measure the Servo Axes Height:** Use a vertical ruler to measure the height of the (horizontal) servo axes. After measuring it, stick a tape into it to have keep the reference.

<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/master/res/step-1-calibration.jpg?raw=true" width="300">
</p>

3) **Adjust the Servo:** Move the servo with COSMOS so that the end of the servo arm extension (at the M3 screw head) is at the same height. Measure the back of the servo arms, not the top of the bolts. When the bolts are not perfectly orthogonally inserted (thread insert not perpendicular to the servo arm extension), significant deviations can be measured.

<p align="center">
  <img src="https://github.com/albertcroig/Stewart.js/blob/master/res/step-2-calibration.jpg?raw=true" width="300">
</p>

4) **Repeat for All Servos**: Perform the above steps for all servos.

After determining the slope and middle position pulse for each servo, input these values into the corresponding calibration object in your code. This ensures that the simulation accurately translates the angles into the correct pulse widths for the servos.

## Issues that remain unsolved to this date

    - skewing of image when large size
    - only integer values accepted in cheap servos
    - calibration data hard to get precisely
    - only 2 or 3 animations accepted at the same time (memory issues)
    - number of steps limited to 2056 (memory issues)