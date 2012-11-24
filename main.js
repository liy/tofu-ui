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


  // keep track of the original selection information.
  var startContainer = _range.startContainer;
  var endContainer = _range.endContainer;
  var startOffset = _range.startOffset;
  var endOffset = _range.endOffset;


  var linebreak = _ranger.walk(LineRanger.FORWARD, _range, paragraphNode);

  // split the selected root node.
  split(linebreak, startContainer, endContainer, startOffset, endOffset);
});

function split(linebreak, startContainer, endContainer, startOffset, endOffset){
  if(!linebreak.atFirstLine){
    // select first part of the paragraph
    selection.removeAllRanges();
    if(_ranger.dir == LineRanger.BACKWARD){
      _range.setStart(linebreak.rootNode, 0);
      _range.setEnd(linebreak.textNode, linebreak.offset);
    }
    else{
      _range.setStart(linebreak.textNode, linebreak.offset);

      var lastTextNode = linebreak.rootNode.lastChild;
      console.log(lastTextNode);
      while(lastTextNode !== null && lastTextNode.nodeType != 3){
        lastTextNode = lastTextNode.lastChild;
        console.log(lastTextNode);
      }
      _range.setEnd(lastTextNode, lastTextNode.textContent.length);
    }
    selection.addRange(_range);

    // insert the first part of the paragraph before the original root node.
    var pElement = document.createElement('p');
    pElement.setAttribute('class', 'piece');
    if(linebreak.rootNode.getAttribute('contentEditable') == "true")
      pElement.setAttribute('contentEditable', "true");
    var fragment = _range.extractContents();
    pElement.appendChild(fragment);
    if(_ranger.dir == LineRanger.BACKWARD)
      linebreak.rootNode.parentNode.insertBefore(pElement, linebreak.rootNode);
    else
      linebreak.rootNode.parentNode.insertBefore(pElement, linebreak.rootNode.nextSibling);




    // reset original selection
    selection.removeAllRanges();
    if(_ranger.dir == LineRanger.BACKWARD){
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
    }
    else{
      _range.setStart(startContainer, startOffset);
      _range.setEnd(endContainer, endOffset);
    }
    selection.addRange(_range);
  }
  else{
    _ranger.resetRange();
  }
}

});