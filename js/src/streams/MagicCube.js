import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
import { DOMWidgetModel, DOMWidgetView } from "@jupyter-widgets/base";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import blueBg from "../../../images/bg.jpg";

const semver_range = "~" + require("../../package.json").version;

export class MagicCubeModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_module: "jupyter-webrtc",
      _view_module: "jupyter-webrtc",
      _model_name: "MagicCubeModel",
      _view_name: "MagicCubeView",
      _model_module_version: semver_range,
      _view_module_version: semver_range,
      width: 640,
      height: 480,
      scale: 1.0,
      position: [0, 0, 0],
      model_url:
        "https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/Duck/glTF/Duck.gltf",
      show_stage: true,
      stage_color: "#11111B",
      show_edges: true,
      fps_limit: 60,
    };
  }

  initialize(attributes, options) {
    super.initialize(attributes, options);

    // promise to track if AR.js has loaded the webcam
    this.webcam_loaded = new Promise((resolve) => {
      this.resolve = resolve;
    });

    window.addEventListener("arjs-video-loaded", (e) => {
      this.resolve();
    });

    this.setupThreeStuff();
    this.setupSource();
    this.setupContext();
    this.setupMarkerRoots();
    this.setupScene();
    // this.animate();
  }

  setupThreeStuff() {
    this.scene = new THREE.Scene();

    // TODO: Add this as a python option
    // this.scene.background = new THREE.TextureLoader().load(blueBg);

    this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(this.ambientLight);

    this.camera = new THREE.Camera();
    this.scene.add(this.camera);
  }

  setupSource() {
    this.arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: "webcam",
      // source height/width used to set ideal in userMediaConstraints
      sourceWidth: this.get("width"),
      sourceHeight: this.get("height"),
      displayWidth: this.get("width"),
      displayHeight: this.get("height"),
    });

    // TODO: resize? Height of cell doesn't change on resize, so to maintain aspect ratio, width of video shouldn't change either
    this.arToolkitSource
      .init
      //function onReady() {this.onResize();}
      ();

    // handle resize event
    // window.addEventListener("resize", () => {
    //   console.log("setup source window listener");
    //   console.log("this-listener", this);
    //   this.onResize();
    // });
  }

  setupContext() {
    console.log("context setup");
    this.arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl:
        THREEx.ArToolkitContext.baseURL + "../data/data/camera_para.dat",
      detectionMode: "mono",
    });

    // copy projection matrix to camera when initialization complete
    this.arToolkitContext.init(() => {
      this.camera.projectionMatrix.copy(
        this.arToolkitContext.getProjectionMatrix(),
      );
    });
  }

  setupMarkerRoots() {
    console.log("marker root setup");
    this.markerRootArray = [];
    this.markerGroupArray = [];
    // this.patternArray = [
    //   new URL("../../data/letterA.patt", import.meta.url),
    //   new URL("../../data/letterB.patt", import.meta.url),
    //   new URL("../../data/letterC.patt", import.meta.url),
    //   new URL("../../data/letterD.patt", import.meta.url),
    //   new URL("../../data/letterF.patt", import.meta.url),
    //   new URL("../../data/kanji.patt", import.meta.url),
    // ];

    this.patternArray = [
      "letterA",
      "letterB",
      "letterC",
      "letterD",
      "letterF",
      "kanji",
    ];

    this.rotationArray = [
      new THREE.Vector3(-Math.PI / 2, 0, 0),
      new THREE.Vector3(0, -Math.PI / 2, Math.PI / 2),
      new THREE.Vector3(Math.PI / 2, 0, Math.PI),
      new THREE.Vector3(-Math.PI / 2, Math.PI / 2, 0),
      new THREE.Vector3(Math.PI, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ];

    for (let i = 0; i < 6; i++) {
      this.markerRoot = new THREE.Group();

      this.markerRootArray.push(this.markerRoot);

      this.scene.add(this.markerRoot);

      this.markerControls = new THREEx.ArMarkerControls(
        this.arToolkitContext,
        this.markerRoot,
        {
          type: "pattern",
          patternUrl:
            THREEx.ArToolkitContext.baseURL +
            "examples/marker-training/examples/pattern-files/pattern-" +
            this.patternArray[i] +
            ".patt",
          // new URL("../../data/" + this.patternArray[i] + ".patt",import.meta.url),
        },
      );

      this.markerGroup = new THREE.Group();
      this.markerGroupArray.push(this.markerGroup);

      this.markerGroup.position.y = -1.25 / 2;
      this.markerGroup.rotation.setFromVector3(this.rotationArray[i]);

      this.markerRoot.add(this.markerGroup);
    }
  }

  setupScene() {
    console.log("scene setup");
    this.sceneGroup = new THREE.Group();

    // a 1x1x1 cube model with scale factor 1.25 fills up the physical cube
    this.sceneGroup.scale.set(1.75 / 2, 1.75 / 2, 1.75 / 2);

    this.buildStage();

    this.cubeEdges();

    this.loadModel();

    // fancy light
    this.pointLight = new THREE.PointLight(0xffffff, 1, 50);
    this.pointLight.position.set(0.5, 3, 2);
    this.scene.add(this.pointLight);
  }

  buildStage() {
    this.loader = new THREE.TextureLoader();

    // TODO: Let user set image
    this.stageTextureImage = this.get("bg") || blueBg;
    this.stageTexture = this.loader.load(this.stageTextureImage);

    // remove old model first
    if (this.stage) {
      this.removeFromScene(this.stage);
    }

    // reversed cube
    this.stageMesh = new THREE.MeshBasicMaterial({
      // map: this.stageTexture,
      color: this.get("stage_color"), //1a1b26
      side: THREE.BackSide,
    });

    this.stage = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), this.stageMesh);
    this.sceneGroup.add(this.stage);
  }

  cubeEdges() {
    // cube edges
    this.edgeGroup = new THREE.Group();

    this.edgeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2, 32);

    this.edgeCenters = [
      new THREE.Vector3(0, -1, -1),
      new THREE.Vector3(0, 1, -1),
      new THREE.Vector3(0, -1, 1),
      new THREE.Vector3(0, 1, 1),
      new THREE.Vector3(-1, 0, -1),
      new THREE.Vector3(1, 0, -1),
      new THREE.Vector3(-1, 0, 1),
      new THREE.Vector3(1, 0, 1),
      new THREE.Vector3(-1, -1, 0),
      new THREE.Vector3(1, -1, 0),
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(1, 1, 0),
    ];

    this.edgeRotations = [
      new THREE.Vector3(0, 0, Math.PI / 2),
      new THREE.Vector3(0, 0, Math.PI / 2),
      new THREE.Vector3(0, 0, Math.PI / 2),
      new THREE.Vector3(0, 0, Math.PI / 2),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.PI / 2, 0, 0),
      new THREE.Vector3(Math.PI / 2, 0, 0),
      new THREE.Vector3(Math.PI / 2, 0, 0),
      new THREE.Vector3(Math.PI / 2, 0, 0),
    ];

    for (let i = 0; i < 12; i++) {
      let edge = new THREE.Mesh(
        this.edgeGeometry,
        new THREE.MeshLambertMaterial({
          color: 0x262626,
        }),
      );

      edge.position.copy(this.edgeCenters[i]);
      edge.rotation.setFromVector3(this.edgeRotations[i]);

      this.edgeGroup.add(edge);
    }

    this.sceneGroup.add(this.edgeGroup);
  }

  loadModel() {
    // instantiate loader
    if (!this.gltfLoader) {
      this.gltfLoader = new GLTFLoader();
    }

    // remove old model first
    if (this.gltfModel) {
      this.removeFromScene(this.gltfModel);
    }

    // load model
    this.gltfLoader.load(
      this.get("model_url"),
      (gltf) => {
        let scale = this.get("scale");
        this.gltfModel = gltf.scene;
        this.gltfModel.scale.set(scale, scale, scale);
        this.gltfModel.position.fromArray(this.get("position"));
        this.sceneGroup.add(this.gltfModel);
      },
      () => {
        console.log("model loading");
      },
      (error) => {
        console.log("Error loading model", error);
      },
    );
  }

  // TODO: Handle ImageBitMaps
  // disposeTexture(texture) {
  //   if (texture instanceof THREE.Texture) {
  //     texture.dispose();
  //   } else if (texture instanceof ImageBitmap) {
  //     // Dispose of ImageBitmap
  //     texture.close();
  //   }
  //   // Add more conditions for other texture types as needed
  // }

  // dispose geometries, materials, and textures associated with previous model
  removeFromScene(object3d) {
    this.sceneGroup.remove(object3d);

    object3d.traverse((object) => {
      if (object.isMesh) {
        // Dispose of textures
        for (const key in object.material) {
          if (key.endsWith("Map") && object.material[key]) {
            object.material[key].dispose();
          }
        }

        // this is the only one with a lower case m so let's just toss it in
        if (object.material.map) {
          object.material.map.dispose();
        }

        object.geometry.dispose();
        object.material.dispose();

        // TODO: Handle ImageBitMaps
      }
    });
  }

  // onResize() {
  //   console.log("this-resize", this);

  //   this.arToolkitSource.onResizeElement();
  //   this.arToolkitSource.copySizeTo(this.renderer.domElement);
  //   if (this.arToolkitContext.arController !== null) {
  //     this.arToolkitSource.copySizeTo(
  //       this.arToolkitContext.arController.canvas,
  //     );
  //   }
  // }
}

MagicCubeModel.serializers = {
  ...DOMWidgetModel.serializers,
};

export class MagicCubeView extends DOMWidgetView {
  async render() {
    // start time for FPS limit
    this.then = performance.now();
    this.fpsInterval = 1000 / this.model.get("fps_limit");

    // Check if webcam feed already exists
    this.webcamFromArjs = document.getElementById("arjs-video");

    // Wait for AR.js to set up webcam feed before rendering view
    if (!this.webcamFromArjs) {
      await this.model.webcam_loaded;
    }

    super.render();

    this.setupRenderer();
    this.inViewObserver();
    this.modelEvents();

    this.el.classList.add("ar-container");

    this.el.appendChild(this.renderer.domElement);

    // Create new webcam element
    this.existingWebcam = document.getElementById("arjs-video");
    this.newWebcam = this.existingWebcam.cloneNode(true);
    this.newWebcam.srcObject = this.existingWebcam.srcObject;
    this.newWebcam.id = `webcamView${Object.keys(this.model.views).length}`;
    this.newWebcam.style.display = "";
    this.el.appendChild(this.newWebcam);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    this.renderer.setSize(this.model.get("width"), this.model.get("height"));
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0px";
    this.renderer.domElement.style.left = "0px";
  }

  animate() {
    this.animationRequestId = window.requestAnimationFrame(
      this.animate.bind(this),
    );

    this.now = performance.now();

    // time elapsed since last frame
    this.elapsed = this.now - this.then;

    // if enough time has passed to render the next frame
    if (this.elapsed > this.fpsInterval) {
      this.then = this.now - (this.elapsed % this.fpsInterval);

      this.update();
      this.renderer.render(this.model.scene, this.model.camera);
    }
  }

  // Stop animation loop if view is not in viewport
  inViewObserver() {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.animate();
      } else {
        window.cancelAnimationFrame(this.animationRequestId);
        this.animationRequestId = undefined;
      }
    });

    this.observer.observe(this.el);
  }

  update() {
    // update artoolkit on every frame
    if (this.model.arToolkitSource.ready !== false)
      this.model.arToolkitContext.update(this.model.arToolkitSource.domElement);

    for (let i = 0; i < 6; i++) {
      if (this.model.markerRootArray[i].visible) {
        this.model.markerGroupArray[i].add(this.model.sceneGroup);
        // console.log("visible: " + this.model.patternArray[i]);
        break;
      }
    }
  }

  modelEvents() {
    this.listenTo(this.model, "change:position", () => {
      this.model.gltfModel.position.fromArray(this.model.get("position"));
    });

    this.listenTo(this.model, "change:scale", () => {
      let scale = this.model.get("scale");
      this.model.gltfModel.scale.set(scale, scale, scale);
    });

    this.listenTo(this.model, "change:model_url", () => {
      this.model.loadModel();
    });

    this.listenTo(this.model, "change:show_stage", () => {
      if (this.model.get("show_stage")) {
        this.model.stage.visible = true;
      } else {
        this.model.stage.visible = false;
      }
    });

    this.listenTo(this.model, "change:stage_color", () => {
      this.model.buildStage();
    });

    this.listenTo(this.model, "change:show_edges", () => {
      if (this.model.get("show_edges")) {
        this.model.edgeGroup.visible = true;
      } else {
        this.model.edgeGroup.visible = false;
      }
    });
  }
}

window.addEventListener("markerFound", () => {
  console.log("Marker found");
});

window.addEventListener("markerLost", () => {
  console.log("Marker lost");
});

window.addEventListener("camera-error", () => {
  console.log("camera error");
});
