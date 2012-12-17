(function(window){
  function JSONSerializer(){

  }
  var p = JSONSerializer.prototype;

  p.init = function(){
    this.converters = {
      // link and image node process
      A: attributesNodeConverter,
      IMG: attributesNodeConverter
    };

    this.styles = {B: 1, EM: 2, I: 4, SMALL: 8, STRONG: 16};
  };

  p.serialize = function(rootNode){
    var article = Object.create(null);
    article.nodes = [];

    this.traverse(rootNode, article, 0);

    return article;
  };

  p.traverse = function(node, obj, styles){
    var i;

    if(this.converters[node.nodeName]){
      obj = this.converters[node.nodeName](node, obj, styles);
    }
    else{
      // if current node is text node, or it has no chiild node(img node)
      if(node.nodeName === "#text" && node.textContent.replace(/ /g, "") !== ""){
        // if the text node is empty, ignore it
        var leaf = Object.create(null);
        leaf.nodeName = node.nodeName;
        leaf.text = Object.create(null);
        leaf.text.data = node.textContent;
        if(styles !== 0) leaf.text.styles = styles;

        obj.nodes.push(leaf);
      }
    }

    // keep traversing the nodes left.
    for(i=0; i<node.childNodes.length; ++i){
      var nextNode = node.childNodes[i];
      // update styles
      styles |= this.styles[nextNode.nodeName];
      this.traverse(nextNode, obj, styles);
    }
  };

  function attributesNodeConverter(node, obj, styles){
    var container = Object.create(null);
    if(node.childNodes.length !== 0)
      container.nodes = [];
    container.nodeName = node.nodeName;
    // set the attribute of the container node.
    container.attributes = Object.create(null);
    for(i=0; i<node.attributes.length; ++i){
      container.attributes[node.attributes[i].name] = node.attributes[i].value;
    }

    obj.nodes.push(container);

    return container;
  }

  window.JSONSerializer = JSONSerializer;



















/*

var BOLD = 1;
var EMPHASIZED = 2;
var ITALIC = 4;
var SMALL = 8;
var STRONG = 16;

function serialize(rootNode){
    var article = {};
    article.nodes = [];

    traverse(rootNode, article, 0);

    return article;
}

function genericSerialize(rootNode){
    var article = Object.create(null);
    article.nodes = [];

    genericTraverse(rootNode, article, 0);

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

function genericTraverse(node, obj, format){
  var i;

  // if the node has any attribute, a container node will be created.
  if(node.attributes && node.attributes.length !== 0){
    var container = Object.create(null);
    if(node.childNodes.length !== 0)
      container.nodes = [];
    container.nodeName = node.nodeName;
    // set the attribute of the container node.
    container.attributes = Object.create(null);
    for(i=0; i<node.attributes.length; ++i){
      container.attributes[node.attributes[i].name] = node.attributes[i].value;
    }

    obj.nodes.push(container);
    obj = container;
  }
  // leaf node, usually a text node or empty element node like img.
  else if(node.childNodes.length === 0){
    var leaf = Object.create(null);

    // if the text node is empty, ignore it
    if(node.textContent.replace(/ /g, "") !== ""){
      leaf.text = Object.create(null);
      leaf.text.data = node.textContent;
      if(format !== 0) leaf.text.format = format;

      obj.nodes.push(leaf);
    }
  }

  // keep traversing the nodes left.
  for(i=0; i<node.childNodes.length; ++i){
    var nextNode = node.childNodes[i];
    traverse(nextNode, obj, updateFormat(nextNode, format));
  }
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

window.JSONSerialzer = {
  serialize: serialize
};
*/

})(window);