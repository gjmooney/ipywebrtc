import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
import { DOMWidgetModel, DOMWidgetView } from "@jupyter-widgets/base";
import * as THREE from "three";
import kanji from "../../data/kanji.patt";
import letterA from "../../data/letterA.patt";
import letterB from "../../data/letterB.patt";
import letterC from "../../data/letterC.patt";
import letterD from "../../data/letterD.patt";
import letterF from "../../data/letterF.patt";
import letterG from "../../data/letterG.patt";

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
  initialize() {
    console.log("initial");

    this.el.classList.add("a-scene-holder");

    this.setupScene();

    console.log("Scene done");

    console.log("start source");
    this.setupSource();

    this.setupContext();

    this.setupMarkerRoots();

    console.log("this.scene", this.scene);
  }

  setupScene() {
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
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.cube);

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
          patternUrl: this.patternArray[i],
        }
      );

      this.markerGroup = new THREE.Group();
      this.markerGroupArray.push(this.markerGroup);
      this.markerGroup.position.y = -1.25 / 2;
      this.markerGroup.rotation.setFromVector3(this.rotationArray[i]);

      this.markerRoot.add(this.markerGroup);
    }
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

    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    this.renderer.render(this.scene, this.camera);
  }

  renderScene() {}

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
