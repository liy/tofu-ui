// $(document).ready(function(){
window.onload = function(){

// clean up the html
document.body.innerHTML = document.body.innerHTML.replace(/\n|\s\s/g, "");

var _selection = window.getSelection();
var _range = document.createRange();
var _ranger = new LineRanger();

var _splitManager = SplitManager.getInstance();
_splitManager.init(_ranger);

// document.addEventListener('mouseup', function(e){
//   console.log(e);

//   if(_selection.type != "Range")
//     return;

//   _range = _selection.getRangeAt(0);

//   // split the selected root node.
//   _splitManager.split(LineRanger.FORWARD, paperElement, createSplitElement, insert);

//   setTimeout(function(){
//     _splitManager.close();
//   }, 1000);
// });

function createSplitElement(linebreak){
  var element = document.createElement('div');
  if(linebreak.rootNode.getAttribute('contentEditable') == "true")
    element.setAttribute('contentEditable', "true");
  element.setAttribute('class', "paper");

  return element;
}

function insert(linebreak){
  var element = document.createElement('div');
  element.setAttribute('class', 'inserted');
  element.innerHTML = "<p>This is the test</p>";
  return element;
}

};
// });