import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
import { DOMWidgetModel, DOMWidgetView } from "@jupyter-widgets/base";
import * as THREE from "three";

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
    console.log("source 1");

    this.arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: "webcam",
    });
    console.log("source 2");

    this.arToolkitSource.init(function onReady() {
      this.onResize();
    });
    console.log("source 3");

    // handle resize event
    window.addEventListener("resize", function () {
      console.log("window listener");
      this.onResize();
    });

    console.log("source 4");

    // console.log("arToolkitSource", arToolkitSource);
  }

  setupContext() {
    console.log("context 1");

    this.arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl:
        THREEx.ArToolkitContext.baseURL + "../data/data/camera_para.dat",
      detectionMode: "mono",
    });
    console.log("context 2");

    // copy projection matrix to camera when initialization complete
    console.log("context 3");

    this.arToolkitContext.init(() => {
      this.camera.projectionMatrix.copy(
        this.arToolkitContext.getProjectionMatrix()
      );
    });
    console.log("context 4");
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
