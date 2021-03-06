core = core || {};

(function() {
    /**
     * Das Modul anypad stellt den Kern des Programms dar. Es verwaltet die Referenzen auf andere Module wie storage, print, htmlparser und regex.
     * Interaktionen des Users werden, aufgefangen von dem Modul eventHandler, an das Modul anypad weitergegeben, welches die passenden Funktionen
     * der jeweiligen gespeicherten Referenzen aufruft.
     * @class
     * @constructor
     * @param {iframe} editor - Richtextfield, welches zum Editieren des Inhalts verwendet wird
     */
    core.anypad = core.anypad || function(editor) {
        var self = this;
        var richTextField = editor;
        var htmlparser = new core.htmlparser();
        var userstorage = new util.userstorage();
        var storage = new util.storage();
        var print = new util.print();
        var regex = new util.regex();
        var currentSearch = {};

        /**
         * Gibt die private variable htmlparser zurück.
         * @return {htmlparser} htmlparser - gespeicherte Referenz des htmlparsers
         */
        this.getHtmlparser = function() {
            return htmlparser;
        };

        /**
         * Gibt die private variable userstorage zurück.
         * @return {userstorage} userstorage - gespeicherte Referenz des userstorages
         */
        this.getUserStorage = function() {
            return userstorage;
        };

        /**
         * Ruft die Initialisierungsfunktion des htmlparsers auf und übergibt die gespeicherte Referenz des editors.
         */
        this.initialize = function() {
            htmlparser.initialize(richTextField);
        };

        /**
         * Bereitet Command für Veränderungen der Schriftgröße vor.
         * @param {string} command - Name des Commands
         * @param {string} id - Id des aktuellen Elements, welches zuvor Event ausgelöst hatte
         * @param {int} size - Zu setzende Schriftgröße
         */
        this.iFontSize = function(command, id, size) {
            htmlparser.buildCommand(command, false, size);
        };

        /**
         * Bereitet Command für Veränderungen der Schriftfarbe vor.
         * @param {string} command - Name des Commands
         * @param {string} id - Id des aktuellen Elements, welches zuvor Event ausgelöst hatte.
         * @param {string} color - Zu setzende Schrifarbe
         */
        this.iForeColor = function(command, id, color) {
            htmlparser.buildCommand(command, false, color);
        };

        /**
         * Bereitet Command für das Einfügen eines Hyperlinks vor.
         * @param {string} command - Name des Commands
         * @param {string} id - Id des aktuellen Elements, welches zuvor Event ausgelöst hatte.
         * @param {string} link - Zu setzender  URL-Link
         */
        this.iLink = function(command, id, link) {
            htmlparser.buildCommand(command, false, link);
        };

        /**
         * Bereitet Command für das Einfügen eines Bilds vor.
         * @param {string} command - Name des Commands
         * @param {string} id - Id des aktuellen Elements, welches zuvor Event ausgelöst hatte.
         * @param {string} imageSrc - Pfad des einzufügenden Bilds.
         */
        this.iImage = function(command, id, imageSrc) {
            htmlparser.buildCommand(command, false, imageSrc);
        };

        /**
         * Bereitet ein einfaches Command vor.
         * @param {string} command - Name des Commands
         * @param {string} id - Id des aktuellen Elements, welches zuvor Event ausgelöst hatte.
         */
        this.simpleCommand = function(command, id) {
            htmlparser.buildCommand(command, false, null);
        };

        /**
         * Gibt Schreibbefehl an den htmlparser weiter.
         * @param {string} html - innerHTML des Editors
         * @param {bool} lineBreak - Gibt an, ob Zeilenumbruch durchgeführt werden soll
         */
        this.writeHTML = function(html, lineBreak) {
            htmlparser.writeHTML(html, lineBreak);
        };

        /**
         * Veranlasst das Schreiben eines default HTML-Konstrukts (<div><br></div>)
         */
        this.writeDefault = function() {
            htmlparser.writeHTMLDefault();
        };

        /**
         * Ermittelt die aktuelle Selektion und erweitert diese, bis der Elterknoten
         * gleich dem tagname ist oder keine Knoten zur Durchsuchung mehr vorhanden sind.
         * @param {string} tagname - Name des HTML-Tags, welches gesucht werden soll.
         * @return {bool} found - Wenn ein Suchtreffer erfolgt, wird true zurückgegeben
         */
        this.detectSelection = function(tagname) {
            var selection = richTextField.contentWindow.document.getSelection();
            node = selection.anchorNode;

            while (node && node.nodeName !== tagname) {
                node = node.parentNode;
            }

            if (node) {
                return true;
            }

            return false;
        };

        /**
         * Öffnet Druckfunktionalität des Moduls print und übergibt innerHTML des Editors.
         */
        this.openPrintDialog = function() {
            //Ist dafür da, dass auch direkt nach dem Öffnen einer Datei diese gedruckt werden kann.
            self.writeHTML(richTextField.contentWindow.document.body.innerHTML);
            var innerHTML = htmlparser.getHTML();
            innerHTML = regex.removeSpanWithAttributes(innerHTML);
            print.doPrint(innerHTML);
        };

        /**
         * innerHTML des Editors wird in Datei abgespeichert.
         */
        this.saveFile = function() {
            var html = htmlparser.getHTML();
            html = regex.removeSpanWithAttributes(html);
            storage.exportJSON(html);
        };

        /**
         * Aus Datei wird innerHTML geladen und dem Editor übergeben.
         */
        this.openFile = function() {
            storage.importJSON();
            var innerHMTL = richTextField.contentWindow.document.body.innerHMTL;
            if (typeof(innerHMTL) !== "undefined") {
                self.writeHTML(innerHMTL);
            }
        };

        /**
         * innerHTML des Editors wird mit intern gespeichertem HTML des htmlparsers aktualisiert.
         */
        this.updateContent = function() {
            htmlparser.update();
        };

        /**
         * Im Text wird nach übergebenem Suchbegriff gesucht. Dieser wird markiert.
         * @param {string} searchstring - String, nach dem gesucht werden soll
         */
        this.search = function(searchString) {
            //Falls Datei geladen wurde und direkt gesucht wird, muss Editorinhalt an htmlparser übergeben werden
            self.writeHTML(richTextField.contentWindow.document.body.innerHTML);
            var innerHTML = htmlparser.getHTML();
            var result;

            if (searchString.length == 0) {
                $(".replace").hide();
                $("#replace_input").val("");
                result = regex.removeSpanWithAttributes(innerHTML);
            } else {
                $(".replace").css("display", "table-cell");
                var res = regex.searchAndMarkTextIgnoringTags(searchString, innerHTML);
                var matchCount = res.results.length;
                result = res;
                currentSearch = res;
                $("#matches").text(matchCount);
            }
            if (typeof(result.resultString) !== "undefined") {
                if (result.resultString !== null) {
                    self.writeHTML(result.resultString, false);
                    self.updateContent();
                }
            } else if (result !== "") {
                self.writeHTML(result, false);
                self.updateContent();
            }
        };

        /**
         * Wiederholt die Suche anhand des zuletzt gesuchten Begriffs
         */
        this.repeatSearch = function() {
            if (currentSearch !== null) {
                if (typeof(currentSearch.search) !== "undefined") {
                    if (currentSearch.search.length > 0) {
                        self.search(currentSearch.search);
                    }
                }
            }
        };

        /**
         * Realisiert das Ersetzen gefundener Begriffe durch einen übergebenen Begriff
         * @param {string} replaceString - String, der ersetzt werden soll
         **/
        this.replaceAll = function(replaceString) {
            if (currentSearch != null) {
                var output = regex.replaceAllIdsInString(replaceString, currentSearch);
                self.writeHTML(output, false);
                htmlparser.update();
                this.repeatSearch();
                $("#replace_input").val("");
            }
        };

        /**
         * Ermittelt die Position des Cursors
         * @return {int} caretPosition - Positon des Cursors
         */
        this.getCaretCharacterOffsetWithin = function() {
            var element = richTextField.contentWindow.document.body;
            var caretOffset = 0;
            var doc = element.ownerDocument || element.document;
            var win = doc.defaultView || doc.parentWindow;
            var sel;
            if (typeof win.getSelection != "undefined") {
                sel = win.getSelection();
                if (sel.rangeCount > 0) {
                    var range = win.getSelection().getRangeAt(0);
                    var preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(element);
                    preCaretRange.setEnd(range.endContainer, range.endOffset);
                    caretOffset = preCaretRange.toString().length;
                }
            } else if ((sel = doc.selection) && sel.type != "Control") {
                var textRange = sel.createRange();
                var preCaretTextRange = doc.body.createTextRange();
                preCaretTextRange.moveToElementText(element);
                preCaretTextRange.setEndPoint("EndToEnd", textRange);
                caretOffset = preCaretTextRange.text.length;
            }
            return caretOffset;
        };

        /**
         * @param {int} caretPosition - Die zu setzende Position des Cursors
         */
        this.setCaretPosition = function(caretPosition) {
            var editor = richTextField.contentWindow.document.getElementById("contentBody");
            if (typeof(editor) !== "undefined" && editor !== null) {
                var range = richTextField.contentWindow.document.createRange();
                range.setStart(editor, caretPosition);
                range.setEnd(editor, caretPosition);
                var sel = richTextField.contentWindow.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }

        self.initialize();
        $('#5').dropdown();
        $('#4').dropdown();
        $("#searchfield").val("");
    };
})();
