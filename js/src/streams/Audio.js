import { StreamModel } from "./Webrtc";

export class AudioStreamModel extends StreamModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: "AudioStreamModel",
      _view_name: "AudioStreamView",
      audio: undefined,
    };
  }

  initialize() {
    super.initialize.apply(this, arguments);
    window.last_audio_stream = this;

    this.type = "audio";
  }
}

AudioStreamModel.serializers = {
  ...StreamModel.serializers,
  audio: { deserialize: widgets.unpack_models },
};

export class AudioStreamView extends widgets.DOMWidgetView {
  render() {
    super.render.apply(this, arguments);
    window.last_audio_stream_view = this;
    this.audio = document.createElement("audio");
    this.audio.controls = true;
    this.pWidget.addClass("jupyter-widgets");

    this.model.captureStream().then(
      (stream) => {
        this.audio.srcObject = stream;
        this.el.appendChild(this.audio);
        this.audio.play();
      },
      (error) => {
        const text = document.createElement("div");
        text.innerHTML =
          "Error creating view for mediastream: " + error.message;
        this.el.appendChild(text);
      }
    );
  }

  remove() {
    this.model.captureStream().then((stream) => {
      this.audio.pause();
      this.audio.srcObject = null;
    });
    return widgets.super.remove.apply(this, arguments);
  }
}
