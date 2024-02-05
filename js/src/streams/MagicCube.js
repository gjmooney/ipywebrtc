import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
import { DOMWidgetModel, DOMWidgetView } from "@jupyter-widgets/base";
import * as THREE from "three";

import xneg from "../../../images/xneg.png";
import xpos from "../../../images/xpos.png";
import yneg from "../../../images/yneg.png";
import ypos from "../../../images/ypos.png";
import zneg from "../../../images/zneg.png";
import zpos from "../../../images/zpos.png";

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
    };
  }
}

MagicCubeModel.serializers = {
  ...DOMWidgetModel.serializers,
};

export class MagicCubeView extends DOMWidgetView {
  // base url = https://ar-js-org.github.io/AR.js/three.js/
  initialize() {
    console.log("initial");

    this.el.classList.add("a-scene-holder");

    console.log("Start three stuff");
    this.setupThreeStuff();

    console.log("start source");
    this.setupSource();

    console.log("start context");
    this.setupContext();

    console.log("start marker roots");
    this.setupMarkerRoots();

    console.log("start scene");
    this.setupScene();

    console.log("this.scene", this.scene);
  }

  setupThreeStuff() {
    this.scene = new THREE.Scene();

    this.ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
    this.scene.add(this.ambientLight);

    // TODO: Use good settings
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    this.renderer.setSize(640, 480);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0px";
    this.renderer.domElement.style.left = "0px";
    this.el.appendChild(this.renderer.domElement);

    // PLAYING WITH CUBE
    // this.geometry = new THREE.BoxGeometry(1, 1, 1);
    // this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // this.cube = new THREE.Mesh(this.geometry, this.material);
    // this.scene.add(this.cube);

    this.camera.position.z = 5;
  }

  setupSource() {
    this.arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: "webcam",
    });

    this.arToolkitSource.init(function onReady() {
      this.onResize();
    });

    // handle resize event
    window.addEventListener("resize", function () {
      console.log("window listener");
      this.onResize();
    });
  }

  setupContext() {
    this.arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl:
        THREEx.ArToolkitContext.baseURL + "../data/data/camera_para.dat",
      detectionMode: "mono",
    });

    // copy projection matrix to camera when initialization complete
    this.arToolkitContext.init(() => {
      this.camera.projectionMatrix.copy(
        this.arToolkitContext.getProjectionMatrix()
      );
    });
  }

  setupMarkerRoots() {
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
        }
      );

      //THREEx.ArToolkitContext.baseURL

      this.markerGroup = new THREE.Group();
      this.markerGroupArray.push(this.markerGroup);

      this.markerGroup.position.y = -1.25 / 2;
      this.markerGroup.rotation.setFromVector3(this.rotationArray[i]);

      this.markerRoot.add(this.markerGroup);
    }

    console.log("markerRootArray", this.markerRootArray);
  }

  setupScene() {
    this.sceneGroup = new THREE.Group();
    console.log("scene 1");

    // a 1x1x1 cube model with scale factor 1.25 fills up the physical cube
    this.sceneGroup.scale.set(1.25 / 2, 1.25 / 2, 1.25 / 2);

    console.log("scene 2");

    this.loader = new THREE.TextureLoader();

    console.log("scene 3");
    // a simple cube
    this.materialArray = [
      new THREE.MeshBasicMaterial({
        map: this.loader.load(xpos),
      }),
      new THREE.MeshBasicMaterial({
        map: this.loader.load(xneg),
      }),
      new THREE.MeshBasicMaterial({
        map: this.loader.load(ypos),
      }),
      new THREE.MeshBasicMaterial({
        map: this.loader.load(yneg),
      }),
      new THREE.MeshBasicMaterial({
        map: this.loader.load(zpos),
      }),
      new THREE.MeshBasicMaterial({
        map: this.loader.load(zneg),
      }),
    ];

    console.log("scene 4");

    console.log("this.materialArray", this.materialArray);

    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      this.materialArray
    );

    console.log("scene 5");

    this.sceneGroup.add(this.mesh);
    console.log("scene 6");
  }

  onResize() {
    this.arToolkitSource.onResize();
    this.arToolkitSource.copySizeTo(this.renderer.domElement);
    if (this.arToolkitContext.arController !== null) {
      this.arToolkitSource.copySizeTo(
        this.arToolkitContext.arController.canvas
      );
    }
  }

  animate() {
    // console.log("this", this);

    window.requestAnimationFrame(this.animate.bind(this));

    // this.cube.rotation.x += 0.01;
    // this.cube.rotation.y += 0.01;

    this.renderer.render(this.scene, this.camera);
  }

  render() {
    console.log("this.animate", this.animate);
    console.log("this.scene", this.scene);
    console.log("this.camera", this.camera);

    super.render();
    this.animate();
    // console.log("this.scene", this.scene);
    console.log("scene", "render");
    // this.renderer.render(this.scene, this.camera);
    // this.animate();

    //animate
  }
}

window.addEventListener("arjs-video-loaded", (e) => {
  // Hide video feed from ar.js that shows up behind output cells
  let el = document.querySelector(".a-scene-holder");
  el.appendChild(e.detail.component);
  // document.querySelector("#arjs-video").setAttribute("style", "display: none");
});

window.addEventListener("markerFound", () => {
  console.log("Marker found");
});

window.addEventListener("markerLost", () => {
  console.log("Marker lost");
});
