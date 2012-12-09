(function(window){
  LineRanger.FORWARD = 1;
  LineRanger.BACKWARD = 0;

  var _selection = null;

  /*
  The range object for walking through the dom tree. Its start and end will be updated.
  */
  var _range = null;

  var _originalPosition = 0;

  var _rootNode = null;

  var _originalRange = null;

  var _traverse = null;

  function LineRanger(){
    _selection = window.getSelection();
  }
  var p = LineRanger.prototype;

  p.find = function(dir, range, rootNode){
    _originalRange = range;
    _range = range.cloneRange();
    _rootNode = rootNode;

    this.dir = dir;
    if(this.dir == LineRanger.FORWARD){
      //***********
      // Need to reset select range into a single character range before retrieve bounding client rect.
      // webkit bug, check forward function for detail
      //***********
      _selection.removeAllRanges();
      _range.setStart(_range.endContainer, _range.endOffset-1);
      _selection.addRange(_range);

      // after reset the selection range into single character, get the original coordinate for line break detection.
      _originalPosition = _range.getBoundingClientRect().bottom;

      _traverse = forward;
      return forward(_range.endContainer, null, _range.endOffset);
    }
    else{
      _originalPosition = _range.getBoundingClientRect().top;
      _traverse = backward;
      return backward(_range.startContainer, null, _range.startOffset);
    }
  };

  p.resetRange = function(){
    _selection.removeAllRanges();
    _selection.addRange(_originalRange);
  };

  function forward(currentNode, closestTextNode, offset){
    // console.log(currentNode);

    if(currentNode.firstChild)
      return _traverse(currentNode.firstChild, closestTextNode);
    else{
      if(currentNode.nodeType == 3){
        if(isNaN(offset))
          offset = 0;

        var len = currentNode.textContent.length;
        for(var i=offset; i<len; ++i){
          //**************************
          // webkit selection range bug. When partially select a wrapped node in forward direction.
          // e.g.,
          // 123456789A<b>BC
          // D</b>
          // If start position is before A at position 9; end position is after B at position 11.
          // Because of the <b>BCD</b> is wrapped into two lines, the range.getBoundingClientRect() in webkit returns
          // a bounding rectangle which even include text 'D'
          //
          // I have to shift both start and end, select only 1 character. Once the selection coordinate y
          // has changed, the line break point is found.
          //**************************
          _selection.removeAllRanges();
          _range.setStart(currentNode, i);
          _range.setEnd(currentNode, i+1);
          _selection.addRange(_range);

          if(_range.getBoundingClientRect().bottom != _originalPosition){
            // Notice that we do not revert back to the closest text node.
            // <b>EFG</b><br>   A   B   C   D
            //                ^
            //                0   1   2   3   4
            //
            // If previous sibling is a <br> node, break at the end of the previous pure text node 'EFG' will result
            // a <br> empty line before node 'ABCD'.
            // However, break at the beginning of node 'ABCD' will put <br> at the end of node 'EFG', this is good because
            // Browser html renderer seems ignore the <br> at the end of the node. There will be no empty line after
            // 'EFG' node.
            // In short, the final rendered html will looks better if we always break at current node!
            return {
              textNode: currentNode,
              offset: i,
              rootNode: _rootNode,
              atEndLine: false};
          }
        }

        closestTextNode = currentNode;
      }

      if(currentNode.nextSibling){
        // console.log('next sibling');
        return _traverse(currentNode.nextSibling, closestTextNode);
      }
      else{
        while((currentNode = currentNode.parentNode) !== _rootNode){
          if(currentNode.nextSibling !== null){
            // console.log('parent next sibling');
            return _traverse(currentNode.nextSibling, closestTextNode);
          }
        }
        // console.log('last line');
        return {
          textNode: closestTextNode,
          offset: closestTextNode.textContent.length,
          rootNode: _rootNode,
          atEndLine: true};
      }
    }
  }

  function backward(currentNode, closestTextNode, offset){
    console.dir(currentNode);

    if(currentNode.lastChild){
      console.log('lastChild');
      return _traverse(currentNode.lastChild, closestTextNode);
    }
    else{
      // If this node has no child.
      // If current node is a text node.
      if(currentNode.nodeType == 3){
        var textLen = currentNode.textContent.length;
        // Notice that we are traversing backward, therefore if no initial offset is provided the
        // start offset should point to the end of the text node.
        if(isNaN(offset))
          offset = textLen;

        for(var i=offset; i>=0; --i){
          _range.setStart(currentNode, i);
          _selection.addRange(_range);

          // once we found the range rect y has changed, the actual offset causes line changes will be
          // 1 character less. Also notice that, the text node might be change if the offset goes over to
          // total text length, therefore the previous text node with offset 0 causes line break.
          if(_range.getBoundingClientRect().top != _originalPosition){
            //   A   B   C   D   <br><b>EFG</b>
            //                 ^
            // 0   1   2   3   4
            //
            // if the start of selection range is 4, pointed at end of the current text node.
            // Although, technically speaking, we can break the line here. But because that previous node
            // could be an empty <br> or other empty node, it is safer to go back to previous pure text node
            // and break at the index 0 at that pure text node.
            if(i+1 >= textLen)
              return {
                textNode: closestTextNode,
                offset: 0,
                rootNode: _rootNode,
                atEndLine: false
              };
            else
              return {
                textNode: currentNode,
                offset: i+1,
                rootNode: _rootNode,
                atEndLine: false
              };
          }
        }

        // if current node is a text node, update the closestTextNode to the currentNode, so we can keep track
        // of the nearest previous sibling text node which is necessary when looking for the line break point.
        closestTextNode = currentNode;
      } // if node is text node.

      // if no line break point found
      // First you need to navigate to current node's sibling node.
      if(currentNode.previousSibling){
        console.log('previous sibling');
        return _traverse(currentNode.previousSibling, closestTextNode);
      }
      // No more siblings, go back to parent node, make sure parent node is not root node.
      else{
        while((currentNode = currentNode.parentNode) !== _rootNode){
          if(currentNode.previousSibling !== null){
            console.log('parent previous sibling');
            return _traverse(currentNode.previousSibling, closestTextNode);
          }
        }
        console.log('first line');
        return {
          textNode: closestTextNode,
          offset: 0,
          rootNode: _rootNode,
          atEndLine: true
        };
      }
    } // node has no child.
  }

  // singleton.
  LineRanger.instance = new LineRanger();

  window.LineRanger = LineRanger;
}(window));