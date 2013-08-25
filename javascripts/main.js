window.onload = function(){

// clean up the html
document.body.innerHTML = document.body.innerHTML.replace(/\n|\s\s/g, "");

var _selection = window.getSelection();
var _range = document.createRange();
var _ranger = new LineRanger();

var _splitManager = SplitManager.getInstance();
_splitManager.init(_ranger);

var papers = document.getElementsByClassName("paper");

var serializer = new JSONSerializer();
serializer.init();
var obj = serializer.serialize(papers[0]);
console.dir(obj);
};
