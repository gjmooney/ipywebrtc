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
      scale: [0.085, 0.085, 0.085],
      position: [0, 0, 0],
      model_url:
        "https://cdn.glitch.com/06bd98b4-97ee-4c07-a546-fe39ca205034%2Fbowser.glb",
      stage_visible: true,
      width: 640,
      height: 480,
    };
  }

  initialize(attributes, options) {
    super.initialize(attributes, options);
    this.event_fired = new Promise((resolve) => {
      this.resolve = resolve;
    });

    // TODO: Should this be here or top level?
    window.addEventListener("arjs-video-loaded", (e) => {
      // console.log("arjs video loaded");
      // let el = document.querySelector(".ar-container");
      // e.detail.component.style.display = "";
      // el.appendChild(e.detail.component);

      console.log("arjs video loaded", this.event_fired);
      this.resolve();
      console.log("arjs video resolved", this.event_fired);
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

    this.ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
    this.scene.add(this.ambientLight);

    // TODO: Use good settings
    // this.camera = new THREE.PerspectiveCamera(
    //   75,
    //   this.el.innerWidth / this.el.innerHeight,
    //   0.1,
    //   1000,
    // );
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

    this.arToolkitSource.init(function onReady() {
      this.onResize();
    });

    // handle resize event
    window.addEventListener("resize", function () {
      console.log("setup source window listener");
      this.onResize();
    });
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

    this.loader = new THREE.TextureLoader();

    // TODO: Let user set image
    this.stageTextureImage = this.get("bg") || blueBg;
    this.stageTexture = this.loader.load(this.stageTextureImage);

    // reversed cube
    this.stage = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshBasicMaterial({
        map: this.stageTexture,
        side: THREE.BackSide,
      }),
    );
    this.sceneGroup.add(this.stage);

    // cube edges
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

      this.stage.add(edge);
    }

    // gltf model
    this.gltfLoader = new GLTFLoader();

    this.gltfLoader.load(
      this.get("model_url"),
      (gltf) => {
        this.gltfModel = gltf.scene;
        //TODO: these should be set from python
        this.gltfModel.scale.fromArray(this.get("scale"));
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

    // fancy light
    this.pointLight = new THREE.PointLight(0xffffff, 1, 50);
    this.pointLight.position.set(0.5, 3, 2);
    this.scene.add(this.pointLight);
  }

  onResize() {
    this.arToolkitSource.onResize();
    // this.arToolkitSource.copySizeTo(this.renderer.domElement);
    if (this.arToolkitContext.arController !== null) {
      this.arToolkitSource.copySizeTo(
        this.arToolkitContext.arController.canvas,
      );
    }
  }
}

MagicCubeModel.serializers = {
  ...DOMWidgetModel.serializers,
};

export class MagicCubeView extends DOMWidgetView {
  // base url = https://ar-js-org.github.io/AR.js/three.js/

  async render() {
    // Check if webcam feed already exists
    this.wc = document.getElementById("arjs-video");

    // Wait for AR.js to set up webcam feed before rendering view
    if (!this.wc) {
      await this.model.event_fired;
    }

    super.render();
    this.setupRenderer();
    this.animate();
    this.model_events();

    this.el.classList.add("ar-container");

    this.el.appendChild(this.renderer.domElement);

    this.existingWebcam = document.getElementById("arjs-video");
    this.newWebcam = this.existingWebcam.cloneNode(true);
    this.newWebcam.srcObject = this.existingWebcam.srcObject;
    this.newWebcam.id = `webcamView${Object.keys(this.model.views).length}`;
    this.newWebcam.style.display = "";

    this.el.appendChild(this.newWebcam);

    console.log("scene", "render");
  }

  finishRender() {}

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
    window.requestAnimationFrame(this.animate.bind(this));

    this.update();
    this.renderer.render(this.model.scene, this.model.camera);
  }

  update() {
    // update artoolkit on every frame
    if (this.model.arToolkitSource.ready !== false)
      this.model.arToolkitContext.update(this.model.arToolkitSource.domElement);

    for (let i = 0; i < 6; i++) {
      if (this.model.markerRootArray[i].visible) {
        this.model.markerGroupArray[i].add(this.model.sceneGroup);
        console.log("visible: " + this.model.patternArray[i]);
        break;
      }
    }
  }

  model_events() {
    this.listenTo(this.model, "change:position", () => {
      this.model.gltfModel.position.fromArray(this.model.get("position"));
    });

    this.listenTo(this.model, "change:scale", () => {
      this.model.gltfModel.scale.fromArray(this.model.get("scale"));
    });

    this.listenTo(this.model, "change:stage_visible", () => {
      if (this.model.get("stage_visible")) {
        this.model.stage.visible = true;
      } else {
        this.model.stage.visible = false;
      }
    });
  }
}

// TODO: Has to be a better way
// window.addEventListener("arjs-video-loaded", (e) => {
//   console.log("arjs video loaded");
//   let el = document.querySelector(".ar-container");
//   e.detail.component.style.display = "";
//   el.appendChild(e.detail.component);
// });

window.addEventListener("markerFound", () => {
  console.log("Marker found");
});

window.addEventListener("markerLost", () => {
  console.log("Marker lost");
});

window.addEventListener("camera-error", () => {
  console.log("camera error");
});
