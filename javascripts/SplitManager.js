(function(window){

  var _selection;
  var _articleContent;

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
    _selection = window.getSelection();

    this.lineRanger = lineRanger;

    _articleContent = document.getElementById("article-content");
    _articleContent.addEventListener("mouseup", mouseUpHandler);
  };

  p.split = function(dir, rootNode, createSplitElementFunc, insertElementFunc){
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
      console.dir(node);
      console.log(node.nodeType);
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

  function mouseUpHandler(e){
    if(_selection.isCollapsed)
      return;

    // search back to its parents to find out whether the selection
    // could trigger split action.
    var node = e.target;
    var isSplitable = false;
    var paragraphNode = null;
    while(node != _articleContent && node.tagName.toLowerCase() != "article"){
      if(node.tagName.toLowerCase() == "p"){
        paragraphNode = node;
      }

      if(node.getAttribute("data-splitable") === "true"){
        isSplitable = true;
        break;
      }

      node = node.parentNode;
    }

    // perform split only when splitable node is valid
    if(!isSplitable)
      return;

    // testing
    splitParagraph(paragraphNode);
  }

  function splitParagraph(targetParagraphNode){
    var range = _selection.getRangeAt(0);
    var lineRanger = SplitManager.instance.lineRanger;

    // keep track of the original selection information.
    var startContainer = range.startContainer;
    var endContainer = range.endContainer;
    var startOffset = range.startOffset;
    var endOffset = range.endOffset;

    // walk the tree to find the line break point
    var linebreak = lineRanger.find(LineRanger.FORWARD, range, targetParagraphNode);

    // set the split id
    var id = (new Date()).getTime() + "-" + Math.floor(Math.random()*10000);
    targetParagraphNode.setAttribute("data-split-id", id);

    // create the splitable paper node to contains all the p nodes after target p node.
    var newContainer = document.createElement('div');
    if(linebreak.rootNode.getAttribute('contentEditable') == "true")
      newContainer.setAttribute('contentEditable', "true");
    newContainer.setAttribute('class', "paper");
    newContainer.setAttribute('data-splitable', "true");

    var currentNode;
    var nextSibling;
    var newParagraphNode;

    if(!linebreak.atFirstLine){
      // select first part of the paragraph
      _selection.removeAllRanges();
      range.setStart(linebreak.textNode, linebreak.offset);
      // find the last text node of the paragraph.
      var lastTextNode = targetParagraphNode.lastChild;
      while(lastTextNode !== null && lastTextNode.nodeType != 3){
        lastTextNode = lastTextNode.lastChild;
      }
      range.setEnd(lastTextNode, lastTextNode.textContent.length);
      _selection.addRange(range);

      // extract the part of the the target paragraph node.
      var fragment = range.extractContents();

      // create new paragraph node to wrap the extracted content.
      newParagraphNode = document.createElement('p');
      newParagraphNode.setAttribute("data-split-id", id);
      newParagraphNode.appendChild(fragment);
      newContainer.appendChild(newParagraphNode);

      // find all the next sibling paragraph nodes
      currentNode = targetParagraphNode.nextSibling;
      while(currentNode){
        nextSibling = currentNode.nextSibling;
        newContainer.appendChild(currentNode);
        currentNode = nextSibling;
      }

      // insert the new container node after the parent of target paragraph node.
      _articleContent.insertBefore(newContainer, targetParagraphNode.parentNode.nextSibling);

      // reset to original selection
      _selection.removeAllRanges();
      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer, endOffset);
      _selection.addRange(range);
    }
    else{
      // find all the next sibling paragraph nodes
      currentNode = targetParagraphNode.nextSibling;
      while(currentNode){
        nextSibling = currentNode.nextSibling;
        newContainer.appendChild(currentNode);
        currentNode = nextSibling;
      }

       // insert the new container node after the parent of target paragraph node.
      _articleContent.insertBefore(newContainer, targetParagraphNode.parentNode.nextSibling);

      lineRanger.resetRange();
    }

    setTimeout(function(){
      targetParagraphNode.innerHTML += newContainer.firstChild.innerHTML;
      newContainer.removeChild(newContainer.firstChild);
      while(newContainer.childNodes.length > 0){
        targetParagraphNode.parentNode.appendChild(newContainer.firstChild);
      }
      _articleContent.removeChild(newContainer);
    }, 2000);
  }

  window.SplitManager = SplitManager;
}(window));