(function(window){

  var _selection;

  function SplitManager(){

  }
  var p = SplitManager.prototype;

  SplitManager.instance = null;

  SplitManager.getInstance = function(){
    if(SplitManager.instance === null)
      SplitManager.instance = new SplitManager();
    return SplitManager.instance;
  };

  p.init = function(lineRanger){
    this.lineRanger = lineRanger;
  };

  p.split = function(dir, rootNode, createSplitElementFunc, insertElementFunc){
    _selection = window.getSelection();
    var range = _selection.getRangeAt(0);

    // keep track of the original selection information.
    var startContainer = range.startContainer;
    var endContainer = range.endContainer;
    var startOffset = range.startOffset;
    var endOffset = range.endOffset;

    // walk the tree to find the line break point
    var linebreak = this.lineRanger.find(dir, range, rootNode);

    if(!linebreak.atFirstLine){
      // select first part of the paragraph
      _selection.removeAllRanges();
      if(this.lineRanger.dir == LineRanger.BACKWARD){
        range.setStart(linebreak.rootNode, 0);
        range.setEnd(linebreak.textNode, linebreak.offset);
      }
      else{
        range.setStart(linebreak.textNode, linebreak.offset);

        var lastTextNode = linebreak.rootNode.lastChild;
        while(lastTextNode !== null && lastTextNode.nodeType != 3){
          lastTextNode = lastTextNode.lastChild;
        }
        range.setEnd(lastTextNode, lastTextNode.textContent.length);
      }
      _selection.addRange(range);

      // insert the first part of the paragraph before the original root node.
      var element = createSplitElementFunc(linebreak);
      var insertElement = null;
      if(insertElementFunc)
        insertElement = insertElementFunc(linebreak);

      var fragment = range.extractContents();

      element.appendChild(fragment);
      if(this.lineRanger.dir == LineRanger.BACKWARD){
        linebreak.rootNode.parentNode.insertBefore(element, linebreak.rootNode);
        if(insertElement)
          linebreak.rootNode.parentNode.insertBefore(insertElement, element);
      }
      else{
        linebreak.rootNode.parentNode.insertBefore(element, linebreak.rootNode.nextSibling);
        if(insertElement)
          linebreak.rootNode.parentNode.insertBefore(insertElement, linebreak.rootNode.nextSibling);
      }

      // reset original selection
      _selection.removeAllRanges();
      if(this.lineRanger.dir == LineRanger.BACKWARD){
        if(startContainer == endContainer){
          if(startContainer == linebreak.textNode){
            range.setStart(startContainer, startOffset-linebreak.offset);
            range.setEnd(startContainer, endOffset-linebreak.offset);
          }
          else{
            range.setStart(startContainer, startOffset);
            range.setEnd(endContainer, endOffset);
          }
        }
        else{
          if(startContainer == linebreak.textNode){
            range.setStart(startContainer, startOffset-linebreak.offset);
            range.setEnd(endContainer, endOffset);
          }
          else{
            range.setStart(startContainer, startOffset);
            range.setEnd(endContainer, endOffset);
          }
        }
      }
      else{
        range.setStart(startContainer, startOffset);
        range.setEnd(endContainer, endOffset);
      }
      _selection.addRange(range);
    }
    else{
      this.lineRanger.resetRange();
    }
  };

  p.close = function(){
    // var contents = document.getElementsByClassName('content');
    dps(document.body, 0, function(node){
      console.log(node);
    });
  };

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

  window.SplitManager = SplitManager;
}(window));