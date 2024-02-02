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
  }

  render() {
    super.render();
    // console.log("this.scene", this.scene);
    console.log("scene", "render");
    // this.renderer.render(this.scene, this.camera);
    // this.animate();

    //animate
  }
}
