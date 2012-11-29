(function(window){

  var _selection;
  var _articleContent;
  var _splitTimeoutID = 0;
  var _delaySplit = 300;

  var _closeFuncs = [];

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
    document.addEventListener("mousedown", function(){
      clearTimeout(_splitTimeoutID);
    });
  };

  p.close = function(){
    // close all other splited nodes
    while(_closeFuncs.length !== 0){
      _closeFuncs.pop()();
    }
  };

  function mouseUpHandler(e){
    clearTimeout(_splitTimeoutID);

    // do not split the paragraph if nothing is selected.
    if(_selection.isCollapsed){
      SplitManager.instance.close();
      return;
    }

    var range = _selection.getRangeAt(0);

    // find the paragraph node
    var paragraphNode = range.startContainer;
    while((paragraphNode = paragraphNode.parentNode) !== null){
      console.log(paragraphNode);
      if(paragraphNode.nodeName.toLowerCase() == "p")
        break;
    }

    // if the paragraph's node is not splitable, do nothing. Since
    // we do not want to split the node other than article content.
    if(paragraphNode.parentNode.getAttribute("data-splitable") != "true")
      return;

    // before split, close splited nodes.
    SplitManager.instance.close();

    _splitTimeoutID = setTimeout(function(){
      // split the paragraph node.
      splitParagraph(paragraphNode);
    }, _delaySplit);
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
    if(linebreak.atEndLine && targetParagraphNode.nextSibling === null){
      if(insertedNode && insertedNode.getAttribute("class") == "inserted"){
        console.log("already inserted, replace the inserted node");
        lineRanger.resetRange();

        return;
      }
      // else you are at the end of the whole paper nodes, just insert a inserted node
      lineRanger.resetRange();
    }
    else{
      // Just set a dummy css style height which ensures article element does not
      // auto pack(shrink) the content when the child nodes are removed.
      // In other word, this prevents scroll thumb jumping when node is removed because of the
      // viewport reaches the end of the html.
      // The css height will be set to empty string at the end of this function.
      //
      // Note there is no need to apply this operation when no nodes are removed during the splitting.
      _articleContent.style.height = (_articleContent.offsetHeight + 200)+"px";

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

      // reset the article element height to default empty string so it can auto wrap the child nodes.
      _articleContent.style.height = "";
    }// inserted node check


    // insert the inserted node
    insertedNode = document.createElement('div');
    insertedNode.setAttribute('class', 'inserted');
    insertedNode.innerHTML = '<h1><ruby>汉<rt>hàn</rt>字<rt>zì</rt></ruby></h1><p>The idea with collections was that they gave people a context into which to publish their ideas. Optionally, the context could be shared, so that lots of people could contribute. But how do you decide what one collection your idea should be in—and how do you decide exactly the right way to frame the context?</p><p>根据以英语作为母语的人数计算，英语是世界上最广泛的第二语言，也是欧盟，诸多国际组织和很多英联邦国家的官方语言之一。但仅拥有世界第三位的母语使用者，少于汉语和西班牙语[1]。上两个世纪英国和美国在文化、经济、军事、政治和科学上的领先地位使得英语成为一种国际语言。英语也是与计算机联系最密切的语言，大多数编程语言都与英语有联系，而且随着互联网的使用，使英文的使用更普及。英语是联合国的工作语言之一。</p>';
    _articleContent.insertBefore(insertedNode, targetParagraphNode.parentNode.nextSibling);

    // test aniamtion
    var insertedHeight = insertedNode.offsetHeight;
    insertedNode.style.height = "0px";
    insertedNode.style.opacity = 0;
    var tl = new TimelineLite();
    tl.to(insertedNode, 0.15, {css:{height: insertedHeight, autoAlpha:1}, ease:Quad.easeOut});
    tl.to(insertedNode, 0.1, {css:{autoAlpha: 1}, ease:Quad.easeOut});

    // keep track of the merge actions
    _closeFuncs.push(function(){
      var tl = new TimelineLite({onComplete:SplitManager.instance.merge, onCompleteParams:[insertedNode]});
      tl.to(insertedNode, 0.1, {css:{autoAlpha:0}});
      tl.to(insertedNode, 0.15, {css:{marginTop: "0em", marginBottom: "0em", height: 0}, ease:Quad.easeOut});
    });
  }

  p.merge = function(insertedNode){
    var range = _selection.getRangeAt(0);
    // keep track of the original selection information.
    var startContainer = range.startContainer;
    var endContainer = range.endContainer;
    var startOffset = range.startOffset;
    var endOffset = range.endOffset;

    var formerParagraphNode = insertedNode.previousSibling.lastChild;
    if(insertedNode.nextSibling){
      var latterPagagraphNode = insertedNode.nextSibling.firstChild;
      // Merge the splited original paragraph node if they exist.
      if(formerParagraphNode.getAttribute("data-paragraph-id") == latterPagagraphNode.getAttribute("data-paragraph-id")){
        // merge the two paragraph
        while(latterPagagraphNode.childNodes.length !== 0){
          formerParagraphNode.appendChild(latterPagagraphNode.firstChild);
        }
        // remove the latter paragraph node from its container.
        latterPagagraphNode.parentNode.removeChild(latterPagagraphNode);

        // normalize the merged node, remove adjacent text nodes and emtpy node(empty node should not happen)
        formerParagraphNode.normalize();
      }

      // append the following paragraph node in the next sibling node of inserted node.
      while(insertedNode.nextSibling.childNodes.length !== 0){
        insertedNode.previousSibling.appendChild(insertedNode.nextSibling.firstChild);
      }

      // remove the inserted node and the splited node
      _articleContent.removeChild(insertedNode.nextSibling);
    }

    _articleContent.removeChild(insertedNode);


        // reset to original selection
        _selection.removeAllRanges();
        range.setStart(startContainer, startOffset);
        range.setEnd(endContainer, endOffset);
        _selection.addRange(range);
  };

  window.SplitManager = SplitManager;
}(window));