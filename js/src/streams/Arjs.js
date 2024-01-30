import {
  DOMWidgetModel,
  DOMWidgetView,
  unpack_models,
} from "@jupyter-widgets/base";
require("aframe");
require("   @ar-js-org/ar.js/three.js/build/ar.js");

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
      marker: null,
      camera: null,
    };
  }

  // TODO: try and use camerastream
  captureStream() {
    if (!this.cameraStream) {
      this.cameraStream = navigator.mediaDevices.getUserMedia(
        // this.get("constraints")
        // TODO: don't hardcode these
        { audio: false, video: { width: 1280, height: 500 } }
      );
    }
    return this.cameraStream;
  }
}

SceneModel.serializers = {
  ...DOMWidgetModel.serializers,
  camera: { deserialize: unpack_models },
  asset_manager: { deserialize: unpack_models },
  marker: { deserialize: unpack_models },
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
    this.createMarker();
    // create camera
    this.createCamera();

    this.el.setAttribute("arjs", "sourceType: webcam; debugUIEnabled: false");
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

  async createMarker() {
    const marker = await this.create_child_view(this.model.get("marker"));
    this.el.appendChild(marker.el);
  }

  render() {
    super.render();

    // this.el.setAttribute("height", "480px");
    this.on(
      "arjs-video-loaded",
      (e) => {
        this.el.style.width = "640px";
        this.el.style.height = "480px";
      },
      this
    );

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
  }
}

window.addEventListener("arjs-video-loaded", (e) => {
  document.body.removeChild(e.detail.component);
});

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
    this.el.setAttribute("id", this.model.get("id"));
    this.el.setAttribute("src", this.model.get("src"));
  }
}

export class MarkerModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_module: "jupyter-webrtc",
      _view_module: "jupyter-webrtc",
      _model_name: "MarkerModel",
      _view_name: "MarkerView",
      _model_module_version: semver_range,
      _view_module_version: semver_range,
      preset: null,
      raycaster: null,
      emitevents: null,
      cursor: null,
      id: null,
      entity: null,
    };
  }
}

MarkerModel.serializers = {
  ...DOMWidgetModel.serializers,
  preset: { deserialize: unpack_models },
  raycaster: { deserialize: unpack_models },
  emitevents: { deserialize: unpack_models },
  cursor: { deserialize: unpack_models },
  id: { deserialize: unpack_models },
  entity: { deserialize: unpack_models },
};

export class MarkerView extends DOMWidgetView {
  get tagName() {
    return "a-marker";
  }

  initialize(options) {
    super.initialize(options);

    this.createEntity();
  }

  async createEntity() {
    let entity = await this.create_child_view(this.model.get("entity"));
    this.el.appendChild(entity.el);
  }

  render() {
    super.render();
    this.el.setAttribute("preset", this.model.get("preset"));
    this.el.setAttribute("raycaster", this.model.get("raycaster"));
    this.el.setAttribute("emitevents", this.model.get("emitevents"));
    this.el.setAttribute("cursor", this.model.get("cursor"));
    this.el.setAttribute("id", this.model.get("id"));
  }
}

export class EntityModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_module: "jupyter-webrtc",
      _view_module: "jupyter-webrtc",
      _model_name: "EntityModel",
      _view_name: "EntityView",
      _model_module_version: semver_range,
      _view_module_version: semver_range,
      id: null,
      // TODO: write a function to change gltf_model and class_name to correct format, maybe
      gltf_model: null,
      position: null,
      scale: null,
      class_name: null,
    };
  }
}

EntityModel.serializers = {
  ...DOMWidgetModel.serializers,
  id: { deserialize: unpack_models },
  gltf_model: { deserialize: unpack_models },
  position: { deserialize: unpack_models },
  scale: { deserialize: unpack_models },
  class_name: { deserialize: unpack_models },
};

export class EntityView extends DOMWidgetView {
  get tagName() {
    return "a-entity";
  }

  render() {
    console.log('this.model.get("gltf_model")', this.model.get("gltf_model"));
    console.log('this.model.get("position")', this.model.get("position"));
    console.log('this.model.get("scale")', this.model.get("scale"));

    super.render();
    this.el.setAttribute("id", this.model.get("id"));
    this.el.setAttribute("gltf-model", this.model.get("gltf_model"));
    this.el.setAttribute("position", this.model.get("position"));
    this.el.setAttribute("scale", this.model.get("scale"));
    this.el.setAttribute("class", this.model.get("class_name"));
    this.el.setAttribute("gesture-handler", "");
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

/* global AFRAME, THREE */
AFRAME.registerComponent("gesture-handler", {
  schema: {
    enabled: { default: true },
    rotationFactor: { default: 0.05 },
    minScale: { default: 0.3 },
    maxScale: { default: 8 },
  },

  init: function () {
    this.handleScale = this.handleScale.bind(this);

    this.mouseUp = this.mouseUp.bind(this);
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseMove = this.mouseMove.bind(this);

    this.x = 0;
    this.y = 0;
    this.isDragging = false;

    this.isVisible = false;
    this.initialScale = this.el.object3D.scale.clone();
    this.scaleFactor = 1;

    this.el.sceneEl.addEventListener("markerFound", (e) => {
      console.log("markerFound");
      this.isVisible = true;
    });

    this.el.sceneEl.addEventListener("markerLost", (e) => {
      console.log("markerLost");
      this.isVisible = false;
    });
  },

  update: function () {
    if (this.data.enabled) {
      this.el.sceneEl.addEventListener("mousedown", this.mouseDown);
      this.el.sceneEl.addEventListener("mousemove", this.mouseMove);
      this.el.sceneEl.addEventListener("mouseup", this.mouseUp);
      this.el.sceneEl.addEventListener("wheel", this.handleScale);
    } else {
      this.el.sceneEl.removeEventListener("mousedown", this.mouseDown);
      this.el.sceneEl.removeEventListener("mousemove", this.mouseMove);
      this.el.sceneEl.removeEventListener("mouseup", this.mouseUp);
      this.el.sceneEl.removeEventListener("wheel", this.handleScale);
    }
  },

  remove: function () {
    this.el.sceneEl.removeEventListener("mousedown", this.mouseDown);
    this.el.sceneEl.removeEventListener("mousemove", this.mouseMove);
    this.el.sceneEl.removeEventListener("mouseup", this.mouseUp);
    this.el.sceneEl.removeEventListener("wheel", this.handleScale);
  },

  mouseDown: function (event) {
    this.x = event.clientX;
    this.y = event.clientY;
    this.isDragging = true;
  },

  mouseMove: function (event) {
    if (this.isDragging) {
      this.el.object3D.rotation.y +=
        (event.clientX - this.x) * this.data.rotationFactor;
      this.el.object3D.rotation.x +=
        (event.clientY - this.y) * this.data.rotationFactor;

      this.x = event.clientX;
      this.y = event.clientY;
    }
  },

  mouseUp: function (event) {
    if (this.isDragging) {
      this.x = 0;
      this.y = 0;
      this.isDragging = false;
    }
  },

  handleScale: function (event) {
    console.log("event", event.wheelDeltaY);
    if (this.isVisible) {
      this.scaleFactor -=
        event.deltaY * (2 / (window.innerWidth + window.innerHeight));

      this.scaleFactor = Math.min(
        Math.max(this.scaleFactor, this.data.minScale),
        this.data.maxScale
      );

      this.el.object3D.scale.x = this.scaleFactor * this.initialScale.x;
      this.el.object3D.scale.y = this.scaleFactor * this.initialScale.y;
      this.el.object3D.scale.z = this.scaleFactor * this.initialScale.z;
    }
  },
});
