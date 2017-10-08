/**
 * ObjViewer
 *
 * View obj-files, load them with an mtl, the corresponding textures and the skybox.
 * Allow the user to fly through the Scene
 *
 * Basic usage:
 *  1. Construct an ObjViewer.
 *  2. Objviewer.load()
 *  3. ObjViewer.requestPointerLock.bind(ObjViewer)
 *  4. ObjViewer.startAnimation()
 *  5. ObjViewer.stopAnimation() (Not needed if an animation pause is not wanted (which it usually isn't))
 */
class ObjViewer {
  /**
   * ObjViewer
   * loads an .obj with a corresponding .mtl file and
   * allows the user to fly trough it via PointerLockControls
   *
   * the files-object (all files are needed):
   * {
   *   skybox : {
   *     path : "path/to",
   *     files : [
   *       "front.jpg", "back.jpg",
   *       "up.jpg"   , "down.jpg",
   *       "right.jpg", "left.jpg"
   *     ]
   *   },
   *   mtl : {
   *     path : "path/to/",
   *     file : "x.mtl"
   *   },
   *   obj : {
   *     path : "path/to/",
   *     file : "y.obj"
   *   }
   *   obj : "y.obj",
   * }
   *
   * Possible callbacks (none are needed):
   * {
   *   onNoPointerLock : () => {
   *     // PointerLock-API is not availavle
   *   }
   *   onPointerLockError : () => {
   *     // A PointerLock-Error ocurred
   *   },
   *   onPointerLock : () => {
   *     // The pointer is locked on the canvas.
   *   },
   *   onPointerUnlock : () => {
   *     // The pointer is unlocked from the canvas
   *   },
   *   onXhrProgress : (xhr, action) => {
   *     // Callback for the progress of a request
   *     // xhr = the xhr-object from the request
   *     // action = one of the actions of this.actions
   *   },
   *   onXhrError : (xhr, action) => {
   *     // Callback for the progress of a request
   *     // xhr = the xhr-object from the request
   *     // action = one of the actions of this.actions
   *   },
   *   onLoaded : () => {
   *     // Called when the skybox, mtl-file and obj-file is loaded.
   *   }
   * }
   *
   * @param  {THREE}             THREE     The three.js Objcet-class
   * @param  {Node}              canvas    The canvas node to draw and animate on
   * @param  {Object}            files     An Object containing the paths and names of all files needed
   * @param  {{name : function}} callbacks An Object containing callbacks for different events
   * @return {ObjViewer}
   */
  constructor (THREE, canvas, files, callbacks) {
    this.THREE = THREE;
    this.callbacks = Object.assign({}, this.getDefaultCallbacks(), callbacks);
    this.floatSpeed = 400;
    this.files = files;
    this.canvas = canvas;
    this.actions = {
      load_obj : "load_obj",
      load_mtl : "load_mtl",
      load_skybox : "load_skybox"
    };
    this.stop = false;

    this.havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    this.velocity = new THREE.Vector3();

    if (this.havePointerLock) {
      this.init();
    } else {
      this.callbacks.onNoPointerLock.call(this);
    }
  }

  /**
   * Initialize the canvas, Listeners, etc.
   *
   * @return {Node} the canvas
   */
  init () {
    this.controlsEnabled = false;

    this.setListeners();

    this.initThree();

    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.initControls();

    this.setLight();

    this.initMtl();
    this.initObj();

    return this.canvas;
  }

  /**
   * Download all files and load them into the canvas.
   *
   * @return {void}
   */
  load () {
    this.loadSkybox();
    this.loadMtl(this.files.mtl.file, this.getLoadObj(this.files.obj.file, this.onObjectLoaded.bind(this)).bind(this));
  }

  /**
   * Animate the canvas
   *
   * @return {void}
   */
  animate() {
    if (!this.stop) {
      requestAnimationFrame(this.animate.bind(this));
    }

    if (this.controlsEnabled) {
      this.updateViewerPosition();
    }

    if (this.stop) {
      this.stop = false;
      this.resetParameters();
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Initialize three.js, its PerspectiveCamera and  its WebGLRenderer.
   *
   * @return {void}
   */
  initThree() {
    this.scene = new this.THREE.Scene();
    this.camera = new this.THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 1000);
    this.renderer = new this.THREE.WebGLRenderer({
      canvas: this.canvas
    });
  }

  /**
   * Initialize the obj-loader
   *
   * @param  {string} [path=this.files.obj.path] The base-path to set, where later the files are located.
   * @return {void}
   */
  initObj(path = this.files.obj.path) {
    this.objLoader = new THREE.OBJLoader();
    this.objLoader.setPath(path);
  }

  /**
   * Initialize the mtl-loader
   *
   * @param  {string} [path=this.files.mtl.path] The base-path to set, where later the files are located.
   * @return {void}
   */
  initMtl(path = this.files.mtl.path) {
    this.mtlLoader = new THREE.MTLLoader();
    this.mtlLoader.setPath(path);
  }

  /**
   * Initialize the controls
   *
   * @return {void}
   */
  initControls() {
    this.controls = new THREE.PointerLockControls( this.camera );
    this.scene.add( this.controls.getObject() );
    this.controlsObject = this.controls.getObject();
  }

  /**
   * Initialize the size of the canvas via the current size.
   *
   * @return {void}
   */
  initSize() {
    this.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  /**
   * Load an obj-file
   *
   * @param  {string}   name                                                      Location of the obj-file (respects the previously set path)
   * @param  {function} onLoaded                                                  onLoaded-callback
   * @param  {function} [onProgress=this.getOnXhrProgress(this.actions.load_mtl)] onProgress-callback
   * @param  {function} [onError=this.getOnXhrError(this.actions.load_obj)]       onError-callback
   * @return {void}
   */
  loadObject(name, onLoaded, onProgress =  this.getOnXhrProgress(this.actions.load_mtl), onError = this.getOnXhrError(this.actions.load_obj)) {
    this.objLoader.load( name, onLoaded, onProgress, this.onError );
  }

  /**
   * Load an mtl-file.
   *
   * @param  {string}   mtlFile                                                   Location of the mtl-file (respects the previously set path)
   * @param  {function} onLoaded                                                  onLoaded-callback
   * @param  {function} [onProgress=this.getOnXhrProgress(this.actions.load_mtl)] onProgress-callback
   * @param  {function} [onError=this.getOnXhrError(this.actions.load_obj)]       onError-callback
   * @return {void}
   */
  loadMtl(mtlFile, onLoaded, onProgress = this.getOnXhrProgress(this.actions.load_mtl), onError = this.getOnXhrError(this.actions.load_obj)) {
    this.mtlLoader.load(mtlFile, onLoaded, onProgress, onError);
  }

  /**
   * Load the skybox.
   *
   * @param  {string}   [path=this.files.skybox.path]    base-path to the image-files
   * @param  {[string]} [images=this.files.skybox.files] the images of the skybox [front, back, up, down, right, left]
   * @return {void}
   */
  loadSkybox(path = this.files.skybox.path, images = this.files.skybox.files) {
    let skybox = "";
    let textureloader = new THREE.CubeTextureLoader();
    textureloader.setPath(path);
    let textureCube = textureloader.load(images, undefined, this.getOnXhrProgress(this.actions.load_skybox), this.getOnXhrError(this.actions.load_skybox));
    this.scene.background = textureCube;
  }

  /**
   * Set the size of canvas.
   *
   * @param  {Number} width  With in px of the canvas.
   * @param  {Number} height Height in px of the canvas.
   * @return {void}
   */
  setSize(width, height) {
    this.windowHalfX = width;
    this.windowHalfY = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Set ambient-light
   *
   * @param  {Number} [light=0xFFFFFF] Light-color
   * @return {void}
   */
  setLight(light = 0xFFFFFF) {
    var ambient = new THREE.AmbientLight( light );
    this.scene.add( ambient );
  }

  /**
   * Set all listeners:
   *  - pointerlockchange
   *  - pointerlockerror
   *  - keydown
   *  - keyup
   *  - mousemove
   *
   * @return {void}
   */
  setListeners() {
    document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
    document.addEventListener('mozpointerlockchange', this.onPointerLockChange.bind(this), false);
    document.addEventListener('webkitpointerlockchange', this.onPointerLockChange.bind(this), false);

    document.addEventListener('pointerlockerror', this.callbacks.onPointerLockError, false);
    document.addEventListener('mozpointerlockerror', this.callbacks.onPointerLockError, false);
    document.addEventListener('webkitpointerlockerror', this.callbacks.onPointerLockError, false);

    document.addEventListener('keydown', this.onKeyDown.bind(this), false);
    document.addEventListener('keyup', this.onKeyUp.bind(this), false);

    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
  }

  /**
   * Set the Postion of the camera (yawObject)
   *
   * @param {Number} x x-coordinate
   * @param {Number} y y-coordinate
   * @param {Number} z z-coordinate
   */
  setPosition(x, y, z) {
    this.controlsObject.position.set(x, y, z);
  }

  /**
   * Gets the default-object of callbacks
   *
   * @return {{name : function}} The default-callbacks
   */
  getDefaultCallbacks () {
    return {
      onNoPointerLock() {
        console.warn("Your browser does not support the Pointer Lock API.");
      },
      onPointerLockError() {
        console.warn("PointerLockError");
      },
      onPointerLock() {},
      onPointerUnlock() {},
      onXhrProgress(xhr, action) {
        console.log(action, "Loaded " + xhr.loaded + " out of " + xhr.total);
      },
      onXhrError(xhr, action) {
        console.log("Error: " + action, xhr);
      },
      onLoaded() {}
    };
  }

  /**
   * getLoadObj with the callbacks already set.
   *
   * @param  {string}   obj                                                       Location of the obj-file
   * @param  {function} onLoaded                                                  onLoaded-callback
   * @param  {function} [onProgress=this.getOnXhrProgress(this.actions.load_obj)] onProgress-callback
   * @param  {function} [onError=this.getOnXhrError(this.actions.load_obj)]       onError-callback
   * @return {function}                                                           The function with the callbacks already set
   */
  getLoadObj(obj, onLoaded, onProgress = this.getOnXhrProgress(this.actions.load_obj), onError = this.getOnXhrError(this.actions.load_obj)) {
    var _this = this;
    return (materials) => {
      materials.preload();
      _this.objLoader.setMaterials(materials);
      _this.objLoader.setMaterials(materials);
      return _this.loadObject(obj, onLoaded, onProgress, onError);
    };
  }

  /**
   * Get the onXhrProgress function with string value already set.
   *
   * @param  {string}   string The string value to set
   * @return {function}        The onXhrProgress-function
   */
  getOnXhrProgress(string) {
    var _this = this;
    return (xhr) => {
      _this.callbacks.onXhrProgress(xhr, string);
    };
  }

  /**
   * Get the getOnXhrError function with string value already set.
   *
   * @param  {string}   string The string value to set
   * @return {function}        The getOnXhrError-function
   */
  getOnXhrError(string) {
    var _this = this;
    return (xhr) => {
      _this.callbacks.onXhrError(string);
    };
  }

  /**
   * Get the current position of the camera (yawObject)
   *
   * @return {Vector3} The x, y and z-coordinate wrapped in an object: {x: 1, y: 2, z: 3}
   */
  position() {
    return this.controlsObject.position;
  }

  /**
   * Bind the move-keys (w, up, left, a, down, s, right, d) for key-up.
   *
   * @param  {EventTarget} event The EventTarget of the keydown-event
   * @return {void}
   */
  onKeyDown(event) {
    switch(event.keyCode) {
      case 38: // up
      case 87: // w
        this.moveForward = true;
        break;

      case 37: // left
      case 65: // a
        this.moveLeft = true;
        break;

      case 40: // down
      case 83: // s
        this.moveBackward = true;
        break;

      case 39: // right
      case 68: // d
        this.moveRight = true;
        break;
    }
  }

  /**
   * Bind the move-keys (w, up, left, a, down, s, right, d) for key-down.
   *
   * @param  {EventTarget} event The EventTarget of the keyup-event
   * @return {void}
   */
  onKeyUp(event) {
    switch(event.keyCode) {
      case 38: // up
      case 87: // w
        this.moveForward = false;
        break;

      case 37: // left
      case 65: // a
        this.moveLeft = false;
        break;

      case 40: // down
      case 83: // s
        this.moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        this.moveRight = false;
        break;
    }
  }

  /**
   * Enable / disable controls and call the callback.
   *
   * @param  {EventTarget} event TheEventTarget of the pointer-lock-change
   * @return {void}
   */
  onPointerLockChange(event) {
    if ( document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas || document.webkitPointerLockElement === this.canvas ) {
      this.controlsEnabled = true;
      this.controls.enabled = true;
      this.callbacks.onPointerLock.call(this, event);
    } else {
      this.controls.enabled = false;
      this.callbacks.onPointerUnlock.call(this, event);
    }
  }

  /**
   * The callbacks when the object is loaded.
   * Adds the object to the scene.
   *
   * @param  {Object3D} object The object to load and add to the scene
   * @return {void}
   */
  onObjectLoaded(object) {
    this.scene.add( object );
    this.callbacks.onLoaded();
  }

  /**
   * Sets the current mouseposition
   *
   * @param  {EventTarget} event The mouse-move EventTarget
   * @return {void}
   */
  onDocumentMouseMove(event) {
    this.mouseX = ( event.clientX - this.windowHalfX ) / 2;
    this.mouseY = ( event.clientY - this.windowHalfY ) / 2;
  }

  /**
   * Request the pointer-lock.
   *
   * @return {void}
   */
  requestPointerLock() {
    this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
    this.canvas.requestPointerLock();
  }

  /**
   * Alias of this.animate()
   *
   * @return {void}
   */
  startAnimation() {
    return animate();
  }

  /**
   * Stop the animation.
   *
   * @return {void}
   */
  stopAnimation() {
    this.stop = true;
  }

  /**
   * Reset all parameters
   *
   * @return {void}
   */
  resetParameters() {
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.prevTime = null;
  }

  /**
   * Update the viewer position based on the pressed keys.
   *
   * @return {void}
   */
  updateViewerPosition () {
    if (!this.prevTime) {
      this.prevTime = performance.now();
    }

    let time = performance.now();
    let delta = ( time - this.prevTime ) / 1000;
    let yDirection = this.camera.getWorldDirection().y;

    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;
    this.velocity.y -= this.velocity.y * 10.0 * delta;

    if (this.moveForward) this.velocity.z -= this.floatSpeed * delta * (1-Math.abs(yDirection));
    if (this.moveBackward) this.velocity.z += this.floatSpeed * delta * (1-Math.abs(yDirection));

    if (this.moveForward) this.velocity.y += this.floatSpeed * delta * yDirection;
    if (this.moveBackward) this.velocity.y -= this.floatSpeed * delta * yDirection;

    if (this.moveLeft) this.velocity.x -= this.floatSpeed * delta;
    if (this.moveRight) this.velocity.x += this.floatSpeed * delta;

    this.controlsObject.translateX(this.velocity.x * delta);
    this.controlsObject.translateY(this.velocity.y * delta);
    this.controlsObject.translateZ(this.velocity.z * delta);

    this.prevTime = time;
  }
}
