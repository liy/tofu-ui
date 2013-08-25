(function(window){
  /*
  default iframe:

  <iframe src="iframe.html" frameBorder="0" style="width: 100%; height: 0">
  </iframe>
  */
  function IFrame(){
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('frameBorder', 0);
    this.iframe.style.width = '100%';
  }
  var p = IFrame.prototype;

  p.init = function(src){
    this.iframe.setAttribute('src', src);
    // iframe onload callback.
    this.iframe.onload = bind(this, this._iframe_onload);
  };

  p.render = function(){
    // wrap the iframe to the content height
    this.iframe.style.height = this.idoc.documentElement.offsetHeight+"px";

    // just a convinient attribute to retrieve the height.
    this.height = this.iframe.style.height;

    console.log(this.iframe.style);
  };

  p._iframe_onload = function(e){
    this.idoc = this.iframe.contentWindow.document;

    // render the iframe
    this.render();

    // delegate iframe onload callback
    if(this.onload) this.onload(e);
  };

  window.IFrame = IFrame;
})(window);