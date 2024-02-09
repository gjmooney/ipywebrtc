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
    console.log("setup source one");
    this.arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: "webcam",
      // source height/width used to set ideal in userMediaConstraints
      sourceWidth: this.get("width"),
      sourceHeight: this.get("height"),
      displayWidth: this.get("width"),
      displayHeight: this.get("height"),
    });

    console.log("setup source two");
    this.arToolkitSource.init(function onReady() {
      this.onResize();
    });

    console.log("setup source three");
    // handle resize event
    window.addEventListener("resize", function () {
      console.log("setup source window listener");
      this.onResize();
    });
    console.log("setup source four");
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
        console.log("gltf.scene", gltf.scene);
        this.gltfModel = gltf.scene;
        //TODO: these should be set from python
        this.gltfModel.scale.fromArray(this.get("scale"));
        this.gltfModel.position.fromArray(this.get("position"));
        this.sceneGroup.add(this.gltfModel);
      },
      () => {
        console.log("loading");
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

  render() {
    super.render();
    this.setupRenderer();
    this.animate();

    this.el.classList.add("ar-container");

    this.el.appendChild(this.renderer.domElement);
    this.model_events();

    console.log(
      "Object.keys(this.model.views).length",
      Object.keys(this.model.views).length,
    );
    console.log("this.model.views.length", this.model.views.length);

    // Make a new video for subsequent views
    if (Object.keys(this.model.views).length > 1) {
      this.existingWebcam = document.querySelector("#arjs-video");
      this.newWebcam = document.createElement("video");

      this.newWebcam.srcObject = this.existingWebcam.srcObject;

      // this.newWebcam.width = this.existingWebcam.width;
      // this.newWebcam.height = this.existingWebcam.height;
      this.newWebcam.playsinline = this.existingWebcam.playsinline;
      this.newWebcam.autoplay = this.existingWebcam.autoplay;
      this.newWebcam.muted = this.existingWebcam.muted;
      this.newWebcam.style = this.existingWebcam.style;
      this.newWebcam.id = `webcamView${Object.keys(this.model.views).length}`;

      // let webclone = webcam.cloneNode(true);
      this.el.appendChild(this.newWebcam);

      if (this.newWebcam.srcObject instanceof MediaStream) {
        let existingStream = this.newWebcam.srcObject;
        console.log("Existing MediaStream:", existingStream);
      } else {
        console.log("fuuucks");
      }
    }

    console.log("scene", "render");
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

    // TODO: Should this be here or top level?
    window.addEventListener("arjs-video-loaded", (e) => {
      console.log("arjs video loaded");
      let el = document.querySelector(".ar-container");
      e.detail.component.style.display = "";
      el.appendChild(e.detail.component);
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
