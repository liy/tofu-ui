$(document).ready(function(){

var selection = window.getSelection();
var _range = document.createRange();
var _ranger = new LineRanger();

document.addEventListener('mouseup', function(){
  if(selection.type != "Range")
    return;

  _range = selection.getRangeAt(0);

  var paragraphNode = _range.startContainer.parentNode;
  // find the direct parent paragraph node, if the start node is not paragraph node
  while(paragraphNode.nodeName.toLowerCase() != 'p'){
    paragraphNode = paragraphNode.parentNode;
  }
  // split the selected root node.
  _ranger.split(paragraphNode);
});

});