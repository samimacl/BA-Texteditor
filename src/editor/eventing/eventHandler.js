'use strict';

var core = core || {};

( function() {
    core.eventHandler = core.eventHandler || new function() {
      var self = this;
      var anypad;
      var richTextField;
      var commands = ['bold', 'underline', 'italic', 'FontSize', 'ForeColor', 'inserthorizontalrule', 'InsertOrderedList', 'InsertUnorderedList', 'CreateLink', 'Unlink', 'insertimage', 'justifyFull'];

      window.addEventListener("load", function load(event){
          window.removeEventListener("load", load, false);
          initAnypad();
          initEvents();
      },false);

        var initAnypad = function () {
          richTextField = document.getElementById("richTextField");
          iFrameOn();
          anypad = new core.anypad( richTextField );
      };

      var initEvents = function () {
        richTextField.contentWindow.document.addEventListener('keyup', richTextFieldOnKeyUp, false);
        var children = [].slice.call(document.getElementById("wysiwyg_cp").getElementsByTagName('*'), 0);
        var elemnts = new Array(children.length);
        for (var i = 0; i < children.length; i++) {
            children[i].addEventListener('click', buttonOnClickDelegate(children[i]), false);
        }
      };

      function richTextFieldOnKeyUp () {
        var html = richTextField.contentWindow.document.body.innerHTML;
        anypad.writeHTML( html );
      };

      var iFrameOn = function (){
        richTextField.contentWindow.document.designMode = 'On';
      };

      function buttonOnClickDelegate(elem) {
        return function () {
          buttononClickHandler(elem)
        }
      };

      function buttononClickHandler(elem) {
        var id = elem.getAttribute('id');
        console.log(id);
        if (id == 4) {
          var size = prompt('Enter a size 1 - 7', '');
          anypad.iFontSize(commands[id-1], id, size);
        } else if (id == 5) {
          var color = prompt('Define a basic color or apply a hexadecimal color code for advanced colors:', '');
          anypad.iForeColor(commands[id-1], id, color);
        } else if (id == 9) {
          var linkURL = prompt("Enter the URL for this link:", "http://");
          if (linkURL != null) {
            anypad.iLink(commands[id-1], id, linkURL);
          }
        } else if (id == 11) {
          var imgSrc = prompt('Enter image location', '');
            if (imgSrc != null){
              anypad.iImage(commands[id-1], id, imgSrc);
            }
        } else {
          anypad.simpleCommand(commands[id-1], id);
        }
      };
  };
} )();
