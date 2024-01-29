import {
  DOMWidgetModel,
  DOMWidgetView,
  unpack_models,
} from "@jupyter-widgets/base";
require("aframe");
// require("@ar-js-org/ar.js");

const semver_range = "~" + require("../../package.json").version;

export class SceneModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_module: "jupyter-webrtc",
      _view_module: "jupyter-webrtc",
      _model_name: "SceneModel",
      _view_name: "SceneView",
      _model_module_version: semver_range,
      _view_module_version: semver_range,
      assets: null,
      asset_manager: null,
      markers: null,
      camera: null,
    };
  }

  // TODO: try and use camerastream
  captureStream() {
    if (!this.cameraStream) {
      this.cameraStream = navigator.mediaDevices.getUserMedia(
        // this.get("constraints")
        // TODO: don't hardcode these
        { audio: false, video: { width: 640, height: 480 } }
      );
    }
    return this.cameraStream;
  }
}

SceneModel.serializers = {
  ...DOMWidgetModel.serializers,
  camera: { deserialize: unpack_models },
  asset_manager: { deserialize: unpack_models },
};

export class SceneView extends DOMWidgetView {
  get tagName() {
    return "a-scene";
  }

  initialize(options) {
    super.initialize(options);

    // create asset manager
    this.createAssetManager();
    // create marker
    // create camera
    this.createCamera();

    this.el.setAttribute("arjs", "sourceType: webcam; debugUIEnabled: false");
    // this.el.setAttribute("arjs", "");
    this.el.setAttribute("embedded", "");
    this.el.setAttribute("renderer", "logarithmicDepthBuffer: true");
    this.el.setAttribute("vr-mode-ui", "enabled: false");
    this.el.setAttribute("id", "scene");
  }

  async createCamera() {
    const camera = await this.create_child_view(this.model.get("camera"));
    // TODO: these should ultimately be passed from the python side
    this.el.appendChild(camera.el);
  }

  async createAssetManager() {
    // TODO: pass {id, src} from python
    const asset_manager = await this.create_child_view(
      this.model.get("asset_manager")
    );

    this.el.appendChild(asset_manager.el);
  }

  render() {
    super.render();

    // this.el.setAttribute("height", "480px");
    this.el.style.width = "640px";
    this.el.style.height = "480px";

    window.last_media_stream_view = this;
    this.video = document.createElement("video");
    this.video.controls = true;

    this.initPromise = this.model.captureStream();

    this.initPromise.then(
      (stream) => {
        // TODO: Get video element in the right spot in DOM
        // this.el.parentNode.insertBefore(this.video, this.el.nextSibling);
        this.video.srcObject = stream;
        this.video.style.position = "absolute";
        this.video.style.display = "block";
        this.el.appendChild(this.video);
        this.video.play();
      },
      (error) => {
        const text = document.createElement("div");
        text.innerHTML =
          "Error creating view for mediastream: " + error.message;
        this.el.appendChild(text);
      }
    );

    // this.pWidget.addClass("jupyter-widgets");
    // this.pWidget.addClass("widget-image");
  }
}

export class AssetManagerModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_module: "jupyter-webrtc",
      _view_module: "jupyter-webrtc",
      _model_name: "AssetManagerModel",
      _view_name: "AssetManagerView",
      _model_module_version: semver_range,
      _view_module_version: semver_range,
      assets: null,
    };
  }
}

AssetManagerModel.serializers = {
  ...DOMWidgetModel.serializers,
  assets: { deserialize: unpack_models },
};

export class AssetManagerView extends DOMWidgetView {
  get tagName() {
    return "a-assets";
  }

  initialize(options) {
    super.initialize(options);

    // create assets
    this.createAssets();
  }

  async createAssets() {
    let assetView = await this.create_child_view(this.model.get("assets"));
    this.el.appendChild(assetView.el);
  }

  render() {
    super.render();
    console.log(`this.model.get('assets')`, this.model.get("assets"));
  }
}

export class AssetModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_module: "jupyter-webrtc",
      _view_module: "jupyter-webrtc",
      _model_name: "AssetModel",
      _view_name: "AssetView",
      _model_module_version: semver_range,
      _view_module_version: semver_range,
      id: null,
      src: null,
    };
  }
}

AssetModel.serializers = {
  ...DOMWidgetModel.serializers,
  id: { deserialize: unpack_models },
  src: { deserialize: unpack_models },
};

export class AssetView extends DOMWidgetView {
  get tagName() {
    return "a-asset-item";
  }

  render() {
    super.render();
  }
}

export class CameraModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_module: "jupyter-webrtc",
      _view_module: "jupyter-webrtc",
      _model_name: "CameraModel",
      _view_name: "CameraView",
      _model_module_version: semver_range,
      _view_module_version: semver_range,
      //TODO: other attributes from a-frame
    };
  }
}

CameraModel.serializers = {
  ...DOMWidgetModel.serializers,
  widget: { deserialize: unpack_models },
};

export class CameraView extends DOMWidgetView {
  get tagName() {
    return "a-camera";
  }

  render() {
    super.render();
    this.el.setAttribute("wasd-controls", "");
    this.el.setAttribute("look-controls", "enabled: false");
    // this.el.classList.remove("a-grab-cursor");
  }
}

// export class ArjsStreamModel extends DOMWidgetModel {
//   defaults() {
//     return {
//       ...super.defaults(),
//       _model_module: "jupyter-webrtc",
//       _view_module: "jupyter-webrtc",
//       _model_name: "ArjsStreamModel",
//       _view_name: "ArjsStreamView",
//       arjs: null,
//       _model_module_version: semver_range,
//       _view_module_version: semver_range,
//     };
//   }

//   initialize() {
//     super.initialize.apply(this, arguments);
//   }
// }

// ArjsStreamModel.serializers = {
//   ...DOMWidgetModel.serializers,
//   widget: { deserialize: unpack_models },
// };

// export class ArjsStreamView extends DOMWidgetView {
//   render() {
//     super.render.apply(this, arguments);
//     window.last_media_stream_view = this;
//     this.canvas = document.createElement("canvas");
//     this.pWidget.addClass("jupyter-widgets");
//     this.pWidget.addClass("widget-image");

//     // create iframe
//     this.iframe = document.createElement("iframe");
//     this.iframe.setAttribute("width", "640px");
//     this.iframe.setAttribute("height", "480px");
//     this.iframe.setAttribute(
//       "srcdoc",
//       `<html>
//         <head>
//           <title>Gesture Interactions - A-Frame & AR.js</title>
//           <meta charset="utf-8" />
//           <meta http-equiv="X-UA-Compatible" content="IE=edge" />
//           <link rel="stylesheet" href="styles.css" />

//           <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
//           <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js"></script>
//           <script>
//           AFRAME.registerComponent("mouse-handler", {
//             schema: {
//               enabled: { default: true },
//               rotationFactor: { default: 0.05 },
//               minScale: { default: 0.3 },
//               maxScale: { default: 8 },
//             },

//             init: function () {
//               this.handleScale = this.handleScale.bind(this);
//               this.handleRotation = this.handleRotation.bind(this);

//               this.mouseUp = this.mouseUp.bind(this);
//               this.mouseDown = this.mouseDown.bind(this);
//               this.mouseMove = this.mouseMove.bind(this);

//               this.x = 0;
//               this.y = 0;
//               this.isDragging = false;

//               this.isVisible = false;
//               this.initialScale = this.el.object3D.scale.clone();
//               this.scaleFactor = 1;

//               this.el.sceneEl.addEventListener("markerFound", (e) => {
//                 console.log("markerFound");
//                 this.isVisible = true;
//               });

//               this.el.sceneEl.addEventListener("markerLost", (e) => {
//                 console.log("markerLost");
//                 this.isVisible = false;
//               });
//             },

//             update: function () {
//               if (this.data.enabled) {
//                 this.el.sceneEl.addEventListener("mousedown", this.mouseDown);
//                 this.el.sceneEl.addEventListener("mousemove", this.mouseMove);
//                 this.el.sceassets
//                 this.el.sceneEl.removeEventListener("mousedown", this.mouseDown);
//                 this.el.sceneEl.removeEventListener("mousemove", this.mouseMove);
//                 this.el.sceneEl.removeEventListener("mouseup", this.mouseUp);
//                 this.el.sceneEl.removeEventListener("wheel", this.handleScale);
//               }
//             },

//             remove: function () {
//               this.el.sceneEl.removeEventListener("mousedown", this.mouseDown);
//               this.el.sceneEl.removeEventListener("mousemove", this.mouseMove);
//               this.el.sceneEl.removeEventListener("mouseup", this.mouseUp);
//               this.el.sceneEl.removeEventListener("wheel", this.handleScale);
//             },

//             mouseDown: function (event) {
//               this.x = event.clientX;
//               this.y = event.clientY;
//               this.isDragging = true;
//             },

//             mouseMove: function (event) {
//               if (this.isDragging) {
//                 this.el.object3D.rotation.y +=
//                   (event.clientX - this.x) * this.data.rotationFactor;
//                 this.el.object3D.rotation.x +=
//                   (event.clientY - this.y) * this.data.rotationFactor;

//                 this.x = event.clientX;
//                 this.y = event.clientY;
//               }
//             },

//             mouseUp: function (event) {
//               if (this.isDragging) {
//                 this.x = 0;
//                 this.y = 0;
//                 this.isDragging = false;
//               }
//             },

//             handleRotation: function (event) {
//               console.log("rotation");
//               if (this.isVisible) {
//                 this.el.object3D.rotation.y +=
//                   event.detail.positionChange.x * this.data.rotationFactor;
//                 this.el.object3D.rotation.x +=
//                   event.detail.positionChange.y * this.data.rotationFactor;
//               }
//             },

//             handleScale: function (event) {
//               console.log("event", event.wheelDeltaY);
//               if (this.isVisible) {
//                 this.scaleFactor -=
//                   event.deltaY * (2 / (window.innerWidth + window.innerHeight));

//                 // 1 + event.detail.spreadChange / event.detail.startSpread;

//                 this.scaleFactor = Math.min(
//                   Math.max(this.scaleFactor, this.data.minScale),
//                   this.data.maxScale
//                 );

//                 this.el.object3D.scale.x = this.scaleFactor * this.initialScale.x;
//                 this.el.object3D.scale.y = this.scaleFactor * this.initialScale.y;
//                 this.el.object3D.scale.z = this.scaleFactor * this.initialScale.z;
//               }
//             },
//           });
//           </script>
//         </head>

//         <body>
//           <a-scene
//             arjs
//             embedded
//             renderer="logarithmicDepthBuffer: true;"
//             vr-mode-ui="enabled: false"
//             id="scene"
//           >
//             <a-assets>
//               <a-asset-item
//                 id="bowser"
//                 src="https://cdn.glitch.com/06bd98b4-97ee-4c07-a546-fe39ca205034%2Fbowser.glb"
//               >
//               </a-asset-item>
//             </a-assets>

//             <a-marker
//               preset="hiro"
//               raycaster="objects: .clickable"
//               emitevents="true"
//               cursor="fuse: false; rayOrigin: mouse;"
//               id="markerA"
//             >
//               <a-entity
//                 id="bowser-model"
//                 gltf-model="#bowser"
//                 position="0 0 0"
//                 scale="0.05 0.05 0.05"
//                 class="clickable"
//                 mouse-handler
//               >
//               </a-entity>
//             </a-marker>
//             <a-entity camera wasd-controls></a-entity>
//           </a-scene>
//         </body>
//       </html>
//       `
//     );

//     this.el.appendChild(this.iframe);
//   }

//   remove() {
//     return super.remove.apply(this, arguments);
//   }
// }
