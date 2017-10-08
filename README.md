# ObjViewer

The library to display obj- and mtl-files to display them including a skybox with WebGL and [three.js](https://threejs.org/).

## Basic Usage

 1. `new ObjViewer(THREE, canvas, files, callbacks)` - Construct an instance.
 2. `Objviewer.load()` - Download the files and load them into the world.
 3. `ObjViewer.requestPointerLock.bind(ObjViewer)` - Request a pointerlock to movein the world.
 4. `ObjViewer.startAnimation()` - Start the animation.
 5. `ObjViewer.stopAnimation()` - Stop the animation. (Not needed if an animation pause is not wanted (which it usually isn't)).

## [Example](https://movabo.github.com/ObjViewer) ([Source](https://github.com/movabo/ObjViewer/blob/master/index.html))

## License (ObjViewer.js)

### MIT License

```Copyright (c) 2017 M. Bock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Attribution

 * three.js, [Copyright © 2010-2017 three.js authors](https://threejs.org/), MIT
   * MTLLoader by angelxuanchang
   * OBJLoader by [mrdoom](http://mrdoob.com/)
   * PointerLockControls by [mrdoom](http://mrdoob.com/)
 * Skybox, [Zachery "freezurbern" Slocum](http://www.freezurbern.com), CC BY-SA 4.0
 * Textures, cm|sheik (sheik@inexor.org), CC BY-SA 4.0
 * Object (Map "star"), cm|sheik (sheik@inexor.org), CC BY-SA 4.0
