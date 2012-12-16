(function(window){

var BOLD = 1;
var EMPHASIZED = 2;
var ITALIC = 4;
var SMALL = 8;
var STRONG = 16;

function serialize(rootNode){
    var article = Object.create(null);
    article.content = [];
    // scan through all the paragraph nodes(or header node)
    for(var i=0; i<rootNode.childElementCount; ++i){
      var pObj = Object.create(null);
      pObj.nodes = [];
      pObj.nodeName = rootNode.childNodes[i].nodeName;

      // scan the paragraph's sub nodes, flatten the node into text node or other
      // nodes such as "link node, image node"
      traverse(rootNode.childNodes[i], pObj, 0, 0);

      article.content.push(pObj);
    }

    return article;
}

function traverse(node, obj, format){
  var i;

  // if current node is text node, or it has no chiild node(img node)
  if(node.childNodes.length === 0){
    var leaf = Object.create(null);

    if(node.textContent.replace(/ /g, "") !== ""){
      leaf.text = Object.create(null);
      leaf.text.data = node.textContent;
      if(format !== 0) leaf.text.format = format;
    }

    // console.dir(node);
    if(node.attributes !== null){
      leaf.attributes = Object.create(null);
      for(i=0; i<node.attributes.length; ++i){
        leaf.attributes[node.attributes[i].name] = node.attributes[i].value;
      }
    }

    if(leaf.text || leaf.attributes){
      leaf.nodeName = node.nodeName;
      obj.nodes.push(leaf);
    }

    // console.log(leaf.text);
  }

  // keep traversing the nodes left.
  for(i=0; i<node.childNodes.length; ++i){
    var nextNode = node.childNodes[i];
    traverse(nextNode, obj, updateFormat(nextNode, format));
  }
}

// function scanSubNodes(node, pObj, format){
//   var childElementCount = node.childElementCount;
//   var i;
//   console.log(node);
//   console.log(childElementCount);
//   // reaching the parent node of a text node, or non-text and empty node(like image)
//   if(node.nodeName == "#text"){
//     var leaf = Object.create(null);

//     // if the current node has a text node.
//     if(node.firstChild){
//       // if the text node is not empty, assign the text information.

//       if(node.textContent.replace(/ /g, "") !== ""){
//         leaf.text = Object.create(null);
//         leaf.text.data = node.textContent;
//         // TODO: assign format bitfield.
//         if(format !== 0) leaf.text.format = format;
//       }
//     }

//     // check whether the current node has any attributes or not.
//     if(node.attributes){
//       leaf.attributes = Object.create(null);
//       for(i=0; i<node.attributes.length; ++i){
//         leaf.attributes[node.attributes[i].name] = node.attributes[i].value;
//       }
//     }

//     // if the leaf node has either text or attribute, store it
//     if(leaf.text || leaf.attributes){
//       leaf.nodeName = node.nodeName;
//       pObj.nodes.push(leaf);
//     }

//     if(node.nextSibling)
//       scanSubNodes(node.nextSibling, pObj, updateFormat(node, format));
//   }
//   else{
//     for(i=0; i<childElementCount; ++i){
//       scanSubNodes(node.childNodes[i], pObj, updateFormat(node, format));
//     }
//   }
// }

function updateFormat(node, format){
  switch(node.nodeName){
    case "B":
      format |= BOLD;
    break;
    case "EM":
      format |= EMPHASIZED;
    break;
    case "I":
      format |= ITALIC;
    break;
    case "SMALL":
      format |= SMALL;
    break;
    case "STRONG":
      format |= STRONG;
    break;
  }
  // console.dir(format);
  return format;
}

window.JSONSerialzer = {
  serialize: serialize
};

})(window);