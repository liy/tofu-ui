$(document).ready(function(){

var cliceTimeoutID = 0;
var lineDetector = new LineDetector();

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


  // keep track of the original selection information.
  var startContainer = _range.startContainer;
  var endContainer = _range.endContainer;
  var startOffset = _range.startOffset;
  var endOffset = _range.endOffset;


  var linebreak = _ranger.walk(LineRanger.BACKWARD, _range, paragraphNode);

  // split the selected root node.
  split(linebreak, startContainer, endContainer, startOffset, endOffset);
});

function split(linebreak, startContainer, endContainer, startOffset, endOffset){
  if(!linebreak.atFirstLine){
    // select first part of the paragraph
    selection.removeAllRanges();
    _range.setStart(linebreak.rootNode, 0);
    _range.setEnd(linebreak.textNode, linebreak.offset);
    selection.addRange(_range);

    // insert the first part of the paragraph before the original root node.
    var pElement = document.createElement('p');
    pElement.setAttribute('class', 'special-p');
    var fragment = _range.extractContents();
    pElement.appendChild(fragment);
    linebreak.rootNode.parentNode.insertBefore(pElement, linebreak.rootNode);


    selection.removeAllRanges();
    if(startContainer == endContainer){
      if(startContainer == linebreak.textNode){
        _range.setStart(startContainer, startOffset-linebreak.offset);
        _range.setEnd(startContainer, endOffset-linebreak.offset);
      }
      else{
        _range.setStart(startContainer, startOffset);
        _range.setEnd(endContainer, endOffset);
      }
    }
    else{
      if(startContainer == linebreak.textNode){
        _range.setStart(startContainer, startOffset-linebreak.offset);
        _range.setEnd(endContainer, endOffset);
      }
      else{
        _range.setStart(startContainer, startOffset);
        _range.setEnd(endContainer, endOffset);
      }
    }
    selection.addRange(_range);
  }
  else{
    _ranger.resetRange();
  }
}

});