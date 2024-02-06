import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
import { DOMWidgetModel, DOMWidgetView } from "@jupyter-widgets/base";
import * as THREE from "three";

import tiles from "../../../images/tiles.jpg";

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

    //this.camera.position.z = 5;
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

    // a 1x1x1 cube model with scale factor 1.25 fills up the physical cube
    this.sceneGroup.scale.set(1.25 / 2, 1.25 / 2, 1.25 / 2);

    this.loader = new THREE.TextureLoader();

    // // a simple cube
    // this.materialArray = [
    //   new THREE.MeshBasicMaterial({
    //     map: this.loader.load(xpos),
    //   }),
    //   new THREE.MeshBasicMaterial({
    //     map: this.loader.load(xneg),
    //   }),
    //   new THREE.MeshBasicMaterial({
    //     map: this.loader.load(ypos),
    //   }),
    //   new THREE.MeshBasicMaterial({
    //     map: this.loader.load(yneg),
    //   }),
    //   new THREE.MeshBasicMaterial({
    //     map: this.loader.load(zpos),
    //   }),
    //   new THREE.MeshBasicMaterial({
    //     map: this.loader.load(zneg),
    //   }),
    // ];

    // this.mesh = new THREE.Mesh(
    //   new THREE.BoxGeometry(1, 1, 1),
    //   this.materialArray
    // );

    // this.sceneGroup.add(this.mesh);

    let test = 1;

    this.tileTexture = this.loader.load(tiles);

    // reversed cube
    this.sceneGroup.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshBasicMaterial({
          map: this.tileTexture,
          side: THREE.BackSide,
        })
      )
    );

    // cube vertices
    this.sphereGeometry = new THREE.SphereGeometry(0.2, 6, 6);

    this.sphereCenters = [
      new THREE.Vector3(-1, -1, -1),
      new THREE.Vector3(-1, -1, 1),
      new THREE.Vector3(-1, 1, -1),
      new THREE.Vector3(-1, 1, 1),
      new THREE.Vector3(1, -1, -1),
      new THREE.Vector3(1, -1, 1),
      new THREE.Vector3(1, 1, -1),
      new THREE.Vector3(1, 1, 1),
    ];
    //5

    this.sphereColors = [
      0x444444, 0x0000ff, 0x00ff00, 0x00ffff, 0xff0000, 0xff00ff, 0xffff00,
      0xffffff,
    ];

    for (let i = 0; i < 8; i++) {
      let sphereMesh = new THREE.Mesh(
        this.sphereGeometry,
        new THREE.MeshLambertMaterial({
          map: this.tileTexture,
          color: this.sphereColors[i],
        })
      );
      sphereMesh.position.copy(this.sphereCenters[i]);
      this.sceneGroup.add(sphereMesh);
    }

    // cube edges
    this.edgeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 32);

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

    this.edgeColors = [
      0x880000, 0x880000, 0x880000, 0x880000, 0x008800, 0x008800, 0x008800,
      0x008800, 0x000088, 0x000088, 0x000088, 0x000088,
    ];

    for (let i = 0; i < 12; i++) {
      let edge = new THREE.Mesh(
        this.edgeGeometry,
        new THREE.MeshLambertMaterial({
          map: this.tileTexture,
          color: this.edgeColors[i],
        })
      );

      edge.position.copy(this.edgeCenters[i]);
      edge.rotation.setFromVector3(this.edgeRotations[i]);

      this.sceneGroup.add(edge);
    }

    // torus knot
    this.sceneGroup.add(
      new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.5, 0.1),
        new THREE.MeshNormalMaterial()
      )
    );

    // fancy light
    this.pointLight = new THREE.PointLight(0xffffff, 1, 50);
    this.pointLight.position.set(0.5, 3, 2);
    this.scene.add(this.pointLight);
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
    window.requestAnimationFrame(this.animate.bind(this));

    // this.cube.rotation.x += 0.01;
    // this.cube.rotation.y += 0.01;

    this.update();
    this.renderer.render(this.scene, this.camera);
  }

  update() {
    // update artoolkit on every frame
    if (this.arToolkitSource.ready !== false)
      this.arToolkitContext.update(this.arToolkitSource.domElement);

    for (let i = 0; i < 6; i++) {
      if (this.markerRootArray[i].visible) {
        this.markerGroupArray[i].add(this.sceneGroup);
        console.log("visible: " + this.patternArray[i]);
        break;
      }
    }
  }

  render() {
    super.render();
    this.animate();
    console.log("scene", "render");
  }
}

window.addEventListener("arjs-video-loaded", (e) => {
  console.log("arjs video loaded");
  // Hide video feed from ar.js that shows up behind output cells
  let el = document.querySelector(".a-scene-holder");
  e.detail.component.classList.add("jl-vid");
  el.appendChild(e.detail.component);
  // document.querySelector("#arjs-video").setAttribute("style", "display: none");
});

window.addEventListener("markerFound", () => {
  console.log("Marker found");
});

window.addEventListener("markerLost", () => {
  console.log("Marker lost");
});
