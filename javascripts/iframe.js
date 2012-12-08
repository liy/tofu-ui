window.onload = function(){
  var height = document.documentElement.offsetHeight;
  window.frameElement.style.height = height + "px";
  window.frameElement.parentNode.style.height = height + "px";
  console.log(window.frameElement.parentNode);
};