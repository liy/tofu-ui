(function(window){

var BOLD = 1;
var EMPHASIZED = 2;
var ITALIC = 4;
var SMALL = 8;
var STRONG = 16;

function serialize(rootNode){
    var article = Object.create(null);
    article.nodes = [];

    traverse(rootNode, article, 0);

    return article;
}

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

function traverse(node, obj, format){
  var i;

  // if it is a link node.
  if(node.nodeName == "A"){
    var linkNode = Object.create(null);
    linkNode.nodes = [];
    linkNode.nodeName = node.nodeName;
    // set the attribute of the link node
    linkNode.attributes = Object.create(null);
    for(i=0; i<node.attributes.length; ++i){
      linkNode.attributes[node.attributes[i].name] = node.attributes[i].value;
    }

    obj.nodes.push(linkNode);
    // keep traverse the child of the link node.
    obj = linkNode;
  }
  else{
    // if current node is text node, or it has no chiild node(img node)
    if(node.childNodes.length === 0){
      var leaf = Object.create(null);

      // if the text node is empty, ignore it
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
    }
  }

  // keep traversing the nodes left.
  for(i=0; i<node.childNodes.length; ++i){
    var nextNode = node.childNodes[i];
    traverse(nextNode, obj, updateFormat(nextNode, format));
  }
}

// function traverse(node, obj, format){
//   var i;

//   // if current node is text node, or it has no chiild node(img node)
//   if(node.childNodes.length === 0){
//     var leaf = Object.create(null);

//     if(node.textContent.replace(/ /g, "") !== ""){
//       leaf.text = Object.create(null);
//       leaf.text.data = node.textContent;
//       if(format !== 0) leaf.text.format = format;
//     }

//     // console.dir(node);
//     if(node.attributes !== null){
//       leaf.attributes = Object.create(null);
//       for(i=0; i<node.attributes.length; ++i){
//         leaf.attributes[node.attributes[i].name] = node.attributes[i].value;
//       }
//     }

//     if(leaf.text || leaf.attributes){
//       leaf.nodeName = node.nodeName;
//       obj.nodes.push(leaf);
//     }

//     // console.log(leaf.text);
//   }

//   // keep traversing the nodes left.
//   for(i=0; i<node.childNodes.length; ++i){
//     var nextNode = node.childNodes[i];
//     traverse(nextNode, obj, updateFormat(nextNode, format));
//   }
// }

window.JSONSerialzer = {
  serialize: serialize
};

})(window);