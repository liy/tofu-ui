(function(window){

  var _selection;
  var _articleContent;
  var _insertedNodes = [];
  var _closingNodes = [];

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

    if(!linebreak.atEndLine){
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
    // do not split the paragraph if nothing is selected.
    if(_selection.isCollapsed)
      return;

    var range = _selection.getRangeAt(0);

    // find the paragraph node
    var node = range.startContainer;
    while((node = node.parentNode) !== null){
      if(node.nodeName.toLowerCase() == "p")
        break;
    }

    // if the paragraph's node is not splitable, do nothing. Since
    // we do not want to split the node other than article content.
    if(node.parentNode.getAttribute("data-splitable") != "true")
      return;

    // split the paragraph node.
    splitParagraph(node);
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

    // if the paragraph node has no id, one must be assigned, since we need to
    // decide of which splited nodes should be merged together when do merging.
    var id = targetParagraphNode.getAttribute("data-paragraph-id");
    if(id === null){
      id = (new Date()).getTime() + "-" + Math.floor(Math.random()*10000);
      targetParagraphNode.setAttribute("data-paragraph-id", id);
    }

    // if the target paragraph node is the last node of the current paper node, and its parent node next sibling
    // node is a inserted node.
    // Just update the existing inserted with the new content.
    var insertedNode = targetParagraphNode.parentNode.nextSibling;
    if(linebreak.atEndLine && targetParagraphNode.nextSibling === null  && insertedNode.getAttribute("class") == "inserted"){
      console.log("already inserted");
      lineRanger.resetRange();
      return;
    }
    // no inserted node, insert one!
    else{
      // create the splitable paper node. It will be containing the splited node and the paragraph nodes
      // after targetParagraphNode.
      var paperNode = document.createElement('div');
      if(linebreak.rootNode.getAttribute('contentEditable') == "true")
        paperNode.setAttribute('contentEditable', "true");
      paperNode.setAttribute('class', "paper");
      paperNode.setAttribute('data-splitable', "true");

      // append all nodes after target paragraph node into newly create paper node
      var currentNode = targetParagraphNode.nextSibling;
      while(currentNode){
        var nextSibling = currentNode.nextSibling;
        paperNode.appendChild(currentNode);
        currentNode = nextSibling;
      }

      var splitedNode;

      if(!linebreak.atEndLine){
        // select the tail part of the targetParagraphNode, from the line break point.
        _selection.removeAllRanges();
        range.setStart(linebreak.textNode, linebreak.offset);
        range.setEnd(targetParagraphNode, targetParagraphNode.childNodes.length);
        _selection.addRange(range);

        // extract the html fragement so we can put into the newly create paperNode.
        var fragment = range.extractContents();

        // create new paragraph node to wrap the extracted content.
        splitedNode = document.createElement('p');
        splitedNode.setAttribute("data-paragraph-id", id);
        splitedNode.appendChild(fragment);
        // add the splited paragraph node into the newly create paper node.
        paperNode.insertBefore(splitedNode, paperNode.firstChild);

        // insert the new container node after the parent of target paragraph node.
        _articleContent.insertBefore(paperNode, targetParagraphNode.parentNode.nextSibling);

        // reset to original selection
        _selection.removeAllRanges();
        range.setStart(startContainer, startOffset);
        range.setEnd(endContainer, endOffset);
        _selection.addRange(range);
      }
      else{
         // insert the new container node after the parent of target paragraph node.
        _articleContent.insertBefore(paperNode, targetParagraphNode.parentNode.nextSibling);

        lineRanger.resetRange();
      }

      // insert the inserted node
      insertedNode = document.createElement('div');
      insertedNode.setAttribute('class', 'inserted');
      insertedNode.innerHTML = "<h1>Inserted!!</h1>";
      _articleContent.insertBefore(insertedNode, targetParagraphNode.parentNode.nextSibling);
    }

    //test close the node in 2 seconds
    setTimeout(function(){
      var formerParagraphNode = insertedNode.previousSibling.lastChild;
      var latterPagagraphNode = insertedNode.nextSibling.firstChild;
      if(formerParagraphNode.getAttribute("data-paragraph-id") == latterPagagraphNode.getAttribute("data-paragraph-id")){
        // merge two paragraph node
        for(var i=0; i<latterPagagraphNode.childNodes.length; ++i){
          formerParagraphNode.appendChild(latterPagagraphNode.childNodes[i]);
        }

        for(var j=1; j<insertedNode.nextSibling.childNodes.length; ++j){
          formerParagraphNode.parentNode.appendChild(insertedNode.nextSibling.childNodes[j]);
        }

        _articleContent.removeChild(insertedNode.nextSibling);
        _articleContent.removeChild(insertedNode);
      }
    }, 2000);
  }

  window.SplitManager = SplitManager;
}(window));