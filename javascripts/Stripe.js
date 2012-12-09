(function(window){
  function Stripe(){
    /*
    * the menu items data, format:
    * { label:string, callback:function}
    */
    this.items = [];
  }
  var p = Stripe.prototype = new IFrame();

  // p.onload = function(e){
  // };

  window.Stripe = Stripe;
})(window);