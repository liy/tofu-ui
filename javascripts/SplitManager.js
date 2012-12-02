(function(window){

  // Add contains method for Node.
  if(window.Node && Node.prototype && !Node.prototype.contains)
  {
    Node.prototype.contains = function (node){
      return this.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY;
    };
  }

  var _selection;
  var _lineRanger;
  var _articleContent;

  var _splitTimeoutID = 0;
  var _delaySplit = 500;

  var _animateCloseFunc = null;

  var _animateInsertFunc = null;

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
    _lineRanger = lineRanger;
    _articleContent = document.getElementById("article-content");

    document.addEventListener("mouseup", mouseUpHandler);
    document.addEventListener("mousedown", function(){
      // stop split action if a mouse is press down.
      clearTimeout(_splitTimeoutID);
    });
  };

  /**
  this function must be called split happend
  */
  p.insert = function(content){
    content = '<h1><ruby>汉<rt>hàn</rt>字<rt>zì</rt></ruby></h1><p>The idea with collections was that they gave people a context into which to publish their ideas. Optionally, the context could be shared, so that lots of people could contribute. But how do you decide what one collection your idea should be in—and how do you decide exactly the right way to frame the context?</p><p>根据以英语作为母语的人数计算，英语是世界上最广泛的第二语言，也是欧盟，诸多国际组织和很多英联邦国家的官方语言之一。但仅拥有世界第三位的母语使用者，少于汉语和西班牙语[1]。上两个世纪英国和美国在文化、经济、军事、政治和科学上的领先地位使得英语成为一种国际语言。英语也是与计算机联系最密切的语言，大多数编程语言都与英语有联系，而且随着互联网的使用，使英文的使用更普及。英语是联合国的工作语言之一。</p>';
    if(_animateInsertFunc)
      _animateInsertFunc(content);
  };

  function mouseUpHandler(e){
    // if the click target is inserted node, do nothing.
    var insertedNodes = document.getElementsByClassName("inserted");
    for(var i=0; i<insertedNodes.length; ++i){
      if(insertedNodes[i].contains(e.target))
        return;
    }

    // if click target is NOT inserted node, and selection is empty. Close the split nodes.
    if(_selection.isCollapsed){
      close();
      return;
    }

    // if split target is valid, close existing splited node first.
    close(function(){
      _splitTimeoutID = setTimeout(split, _delaySplit);
    });
  }

  function close(delaySplitFunc){
    console.log("close");
    if(_animateCloseFunc){
      _animateCloseFunc(delaySplitFunc);
      _animateCloseFunc = null;
      _animateInsertFunc = null;
    }
    else if(delaySplitFunc)
      delaySplitFunc();
  }

  function split(){
    // console.log("split: ");
    // TODO: if no selection, do nothing.
    if(_selection.rangeCount === 0)
      return;

    // find the split target node
    var range = _selection.getRangeAt(0);
    var node = range.endContainer;
    var targetNode = null;
    while(node.parentNode !== _articleContent){
      if(node.parentNode.getAttribute("data-splitable") == "true"){
        targetNode = node;
        break;
      }
      node = node.parentNode;
    }

    // if the target node can not be splited, do nothing
    if(targetNode === null)
      return;

    // keep track of the original selection information.
    var startContainer = range.startContainer;
    var endContainer = range.endContainer;
    var startOffset = range.startOffset;
    var endOffset = range.endOffset;

    var linebreak = _lineRanger.find(LineRanger.FORWARD, range, targetNode);

    // if the targetNode has no id, one must be assigned, since we need to
    // decide of which splited nodes should be merged together when do merging.
    var id = targetNode.getAttribute("data-split-id");
    if(id === null){
      id = (new Date()).getTime() + "-" + Math.floor(Math.random()*10000);
      targetNode.setAttribute("data-split-id", id);
    }

    var parentNextSibling = targetNode.parentNode.nextSibling;
    // the line break position is at the end of the line. Also the targetNode is going to be split is
    // the last child of its parent container.
    if(linebreak.atEndLine && targetNode.nextSibling === null){
      // if the parent sibling node exists, and it is a inserted node. Just replace its content with new content.
      // No need to insert new node.
      if(parentNextSibling && parentNextSibling.getAttribute("class") == "inserted"){
        console.log("inserted node exists");
        _lineRanger.resetRange();
        return;
      }
      // else it is the end of whole paper node, just reset the selection then append a new insert node
      _lineRanger.resetRange();
    }
    // line break position is in the middle of a paper node. The paper node must be splited, new paper node must be created
    // to contains all the following nodes of targetNode, possibly also the fragment of the targetNode(if the line break position
    // is in the middle of the targetNode).
    else{
      // Just set a dummy css height which ensures article element does not
      // auto pack(shrink) its content when its child nodes are removed.
      // This prevents scroll thumb jumping around when node is removed because of
      // viewport reaching the end of the html.
      // The css height will be set to empty string at the end of this function.
      //
      // Note there is no need to apply this operation when no nodes are removed during the splitting. That's why
      // this operation only exists in this "else clause".
      _articleContent.style.height = (_articleContent.offsetHeight + 200)+"px";

      // create a new paper node contains the splited fragements from targetNode, and targetNode's all following nodes.
      var paperNode = document.createElement('div');
      if(linebreak.rootNode.getAttribute('contentEditable'))
        paperNode.setAttribute('contentEditable', linebreak.rootNode.getAttribute('contentEditable'));
      paperNode.setAttribute('class', "paper");
      paperNode.setAttribute('data-splitable', "true");

      // append all nodes following targetNode into the new paper node. Note that those nodes are not modified.
      while(targetNode.nextSibling){
        paperNode.appendChild(targetNode.nextSibling);
      }

      // the line break position is at the end of the targetNode, no need to split the targetNode just insert the new paper node.
      if(linebreak.atEndLine){
        _articleContent.insertBefore(paperNode, parentNextSibling);
        // Simply reset the selection range, since no selected nodes' structure are damaged.
        _lineRanger.resetRange();
      }
      else{
        // extract the fragment, tail part of the targetNode
        _selection.removeAllRanges();
        range.setStart(linebreak.textNode, linebreak.offset);
        // note that we need make the selection at the "base node level" otherwise it might leave empty non-textNode at the end of the targetNode.
        range.setEnd(targetNode, targetNode.childNodes.length);
        _selection.addRange(range);

        // extract the html fragement so we can put into the newly create paperNode.
        var fragment = range.extractContents();

        // create the splited node contains the fragment. It must have the same id of the targetNode, so it can be merged when close.
        var splitedNode = document.createElement(targetNode.tagName);
        splitedNode.setAttribute("data-split-id", id);
        splitedNode.appendChild(fragment);
        paperNode.insertBefore(splitedNode, paperNode.firstChild);

        // insert the paper node.
        _articleContent.insertBefore(paperNode, parentNextSibling);

        // reset to original selection
        _selection.removeAllRanges();
        range.setStart(startContainer, startOffset);
        range.setEnd(endContainer, endOffset);
        _selection.addRange(range);
      }
      // reset the article element height to default empty string so it can auto wrap the child nodes.
      _articleContent.style.height = "";
    }// end of the operation that line break is at the middle of the paper node.

    // insert the inserted node
    insertedNode = document.createElement('div');
    insertedNode.setAttribute('class', 'inserted');
    _articleContent.insertBefore(insertedNode, targetNode.parentNode.nextSibling);

    // keep track of the merge action, close function closure
    _animateCloseFunc = function(mergeCompleteFunc){
      var tl = new TimelineLite({onComplete:merge, onCompleteParams:[insertedNode, mergeCompleteFunc]});
      tl.to(insertedNode, 0.1, {css:{autoAlpha:0}});
      tl.to(insertedNode, 0.15, {css:{marginTop: "0em", marginBottom: "0em", height: 0}, ease:Quad.easeOut});
    };

    // insert function closure, add the insert content.
    _animateInsertFunc = function(content){
      insertedNode.innerHTML = content;
      // animation the split operation
      var insertedHeight = insertedNode.offsetHeight;
      insertedNode.style.height = "0px";
      insertedNode.style.opacity = 0;
      var tl = new TimelineLite();
      tl.to(insertedNode, 0.15, {css:{height: insertedHeight, autoAlpha:1}, ease:Quad.easeOut});
      tl.to(insertedNode, 0.1, {css:{autoAlpha: 1}, ease:Quad.easeOut});
    };

    SplitManager.instance.insert();
  }

  function merge(insertedNode, mergeCompleteFunc){
    var range;
    // keep track of the original selection information.
    var startContainer, endContainer, startOffset, endOffset;
    if(_selection.rangeCount !== 0){
      range = _selection.getRangeAt(0);

      startContainer = range.startContainer;
      endContainer = range.endContainer;
      startOffset = range.startOffset;
      endOffset = range.endOffset;
    }

    var formerSplitedNode = insertedNode.previousSibling.lastChild;
    if(insertedNode.nextSibling){
      var latterSplitedNode = insertedNode.nextSibling.firstChild;
      // Merge the splited nodes if they exist.
      if(formerSplitedNode.getAttribute("data-split-id") == latterSplitedNode.getAttribute("data-split-id")){
        // update the range selected nodes and offset
        if(formerSplitedNode.lastChild.nodeType == latterSplitedNode.firstChild.nodeType){
          if(startContainer == latterSplitedNode.firstChild){
            console.log("update startContainer");
            startContainer = formerSplitedNode.lastChild;
            startOffset += formerSplitedNode.lastChild.length;
          }
          if(endContainer == latterSplitedNode.firstChild){
            console.log("update endContainer");
            endContainer = formerSplitedNode.lastChild;
            endOffset += formerSplitedNode.lastChild.length;
          }
        }

        // merge the two splited nodes
        while(latterSplitedNode.firstChild){
          formerSplitedNode.appendChild(latterSplitedNode.firstChild);
        }
        // remove the latter node from its container.
        latterSplitedNode.parentNode.removeChild(latterSplitedNode);

        // normalize the merged node, remove adjacent text nodes and emtpy node(empty node should not happen)
        formerSplitedNode.normalize();
      }

      // append the following nodes into the node preceding the inserted node
      while(insertedNode.nextSibling.firstChild){
        insertedNode.previousSibling.appendChild(insertedNode.nextSibling.firstChild);
      }

      // remove the inserted node and the splited node
      _articleContent.removeChild(insertedNode.nextSibling);
    }

    _articleContent.removeChild(insertedNode);

    // reset to original selection
    if(range){
      _selection.removeAllRanges();
      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer, endOffset);
      _selection.addRange(range);
    }

    if(mergeCompleteFunc)
      mergeCompleteFunc();
  }

  window.SplitManager = SplitManager;
}(window));