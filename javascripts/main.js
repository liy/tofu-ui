$(document).ready(function(){

var _selection = window.getSelection();
var _range = document.createRange();
var _ranger = new LineRanger();

var _originalContainerInnerHTML = document.body.firstChild.innerHTML;

document.addEventListener('mouseup', function(){
  if(_selection.type != "Range")
    return;

  _range = _selection.getRangeAt(0);

  var paragraphNode = _range.startContainer.parentNode;
  // find the direct parent paragraph node, if the start node is not paragraph node
  while(paragraphNode.nodeName.toLowerCase() != 'div'){
    paragraphNode = paragraphNode.parentNode;
  }
  // split the selected root node.
  _ranger.split(paragraphNode, createSplitElement, insert);

  setTimeout(close, 1000);
});

function createSplitElement(linebreak){
  var element = document.createElement('div');
  if(linebreak.rootNode.getAttribute('contentEditable') == "true")
    element.setAttribute('contentEditable', "true");
  element.setAttribute('class', "paper");

  return element;
}

function insert(linebreak){
  var element = document.createElement('div');
  element.setAttribute('class', 'inserted');
  element.innerHTML = "<p>This is the test</p>";
  return element;
}

function close(){
  // var contents = document.getElementsByClassName('content');
  dps(document.body, 0, function(node){
    console.log(node);
  });
}

function dps(node, index, checkTargetNode){
  if(!checkTargetNode(node)){
    var len = node.childNodes.length;
    for(var i=0; i<len; ++i, ++index){
      var result = dps(node.childNodes[i], index, checkTargetNode);
      if(result)
        return result;
    }
  }
  else{
    return {node: node, index: index};
  }
}

});