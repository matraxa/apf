/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __ENABLE_EDITOR_CLIPBOARD || __INC_ALL

apf.ContentEditable.plugin('pastetext', function() {
    this.name        = 'pastetext';
    this.icon        = 'pastetext';
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+v';
    this.state       = apf.OFF;

    var panelBody;

    this.init = function(editor, btn) {
        this.buttonNode.className = this.buttonNode.className + " dropdown_small";
        var oArrow = this.buttonNode.insertBefore(document.createElement('span'),
            this.buttonNode.getElementsByTagName("div")[0]);
        oArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            apf.popup.setContent(this.uniqueId, this.createPanelBody());
        }

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        this.editor.showPopup(this, this.uniqueId, this.buttonNode, 300, 270);
        if (panelBody.style.visibility == "hidden")
            panelBody.style.visibility = "visible";
        var _self = this;
        setTimeout(function() {
            _self.oArea.focus();
        }, 100); // 100ms, because of the $focusfix code...
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        return this.state;
    };

    this.submit = function(e) {
        apf.popup.forceHide();

        var sContent = this.oArea.value;
        if (!sContent || sContent.length == 0) return;

        var rl = ['\u2122', '<sup>TM</sup>', '\u2026', '...', '\u201c|\u201d', 
            '"', '\u2019,\'', '\u2013|\u2014|\u2015|\u2212', '-'];
        for (var i = 0; i < rl.length; i += 2)
            sContent = sContent.replace(new RegExp(rl[i], 'gi'), rl[i+1]);

        sContent = sContent.replace(/\r\n/g, '<br />')
            .replace(/\r/g, '<br />')
            .replace(/\n/g, '<br />');
        this.editor.insertHTML(sContent);

        if (e.stop)
            e.stop();
        else
            e.cancelBubble = true;
        return false;
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var idArea = 'editor_' + this.uniqueId + '_input';
        var idBtns = 'editor_' + this.uniqueId + '_btns';
        panelBody.innerHTML =
           '<label for="' + idArea + '">' +
           this.editor.translate('paste_keyboardmsg').sprintf(apf.isMac ? 'CMD+V' : 'CTRL+V')
           + '</label>\
            <textarea id="' + idArea + '" name="' + idArea + '"  wrap="soft" dir="ltr" \
              cols="60" rows="10" class="editor_textarea"></textarea>\
            <div class="editor_panelrow" style="position:absolute;bottom:0;width:100%" id="' + idBtns + '"></div>';

        this.oArea = document.getElementById(idArea);
        
        //#ifdef __WITH_WINDOW_FOCUS
        apf.sanitizeTextbox(this.oArea);
        // #endif

        if (apf.isIE) {
            this.oArea.onselectstart = this.oArea.onpaste = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
            };
        }
        this.appendAmlNode(
           '<a:toolbar xmlns:a="' + apf.ns.aml + '"><a:bar>\
            <a:button caption="' + this.editor.translate('insert') + '" \
              onclick="apf.lookup(' + this.uniqueId + ').submit(event)" />\
            </a:bar></a:toolbar>',
          document.getElementById(idBtns));

        return panelBody;
    };

    this.destroy = function() {
        panelBody = this.oArea = null;
        delete panelBody;
        delete this.oArea;
    };
});
apf.ContentEditable.plugin('pasteword', function() {
    this.name        = 'pasteword';
    this.icon        = 'pasteword';
    this.type        = apf.CMDMACRO;
    this.hook        = 'onpaste';
    this.keyBinding  = 'ctrl+shift+v';
    this.state       = apf.OFF;
    
    this.parse = function(sContent) {
        // Cleanup Word content
        var bull   = String.fromCharCode(8226);
        var middot = String.fromCharCode(183);
        // convert headers to strong typed character (BOLD)
        sContent = sContent.replace(new RegExp('<p class=MsoHeading.*?>(.*?)<\/p>', 'gi'), '<p><b>$1</b></p>')
            .replace(new RegExp('tab-stops: list [0-9]+.0pt">', 'gi'), '">' + "--list--")
            .replace(new RegExp(bull + "(.*?)<BR>", "gi"), "<p>" + middot + "$1</p>")
            .replace(new RegExp('<SPAN style="mso-list: Ignore">', 'gi'), "<span>" + bull) // Covert to bull list
            .replace(/<o:p><\/o:p>/gi, "")
            .replace(new RegExp('<br style="page-break-before: always;.*>', 'gi'), '-- page break --') // Replace pagebreaks
            .replace(new RegExp('<(!--)([^>]*)(--)>', 'g'), "")  // Word comments
            .replace(/<\/?span[^>]*>/gi, "") //remove Word-generated superfluous spans
            .replace(new RegExp('<(\\w[^>]*) style="([^"]*)"([^>]*)', 'gi'), "<$1$3") //remove inline style attributes
            .replace(/<\/?font[^>]*>/gi, "")
            .replace(/<(\w[^>]*) class=([^ |>]*)([^>]*)/gi, "<$1$3") // Strips class attributes.
            //.replace(new RegExp('<(\\w[^>]*) class="?mso([^ |>]*)([^>]*)', 'gi'), "<$1$3"); //MSO class attributes
            //.replace(new RegExp('href="?' + this._reEscape("" + document.location) + '', 'gi'), 'href="' + this.editor.documentBaseURI.getURI());
            .replace(/<(\w[^>]*) lang=([^ |>]*)([^>]*)/gi, "<$1$3")
            .replace(/<\\?\?xml[^>]*>/gi, "")
            .replace(/<\/?\w+:[^>]*>/gi, "")
            .replace(/-- page break --\s*<p>&nbsp;<\/p>/gi, "") // Remove pagebreaks
            .replace(/-- page break --/gi, "") // Remove pagebreaks
            .replace(/<\/p>/gi, "<br /><br />") //convert <p> newlines to <br> ones
            .replace(/<\/?p[^>]*>/gi, "")
            .replace(/<\/?div[^>]*>/gi, "")
            .replace(/<TABLE[^>]*cellPadding=[^>]*>/gi, '<table border="0">') //correct tables
            .replace(/<td[^>]*vAlign=[^>]*>/gi, '<td>');
            //.replace(/\/?&nbsp;*/gi, ""); &nbsp;
            //.replace(/<p>&nbsp;<\/p>/gi, '');
            // Replace all headers with strong and fix some other issues
        //sContent = sContent.replace(/<h[1-6]>&nbsp;<\/h[1-6]>/gi, '<p>&nbsp;&nbsp;</p>')
        //    .replace(/<h[1-6]>/gi, '<p><b>')
        //    .replace(/<\/h[1-6]>/gi, '</b></p>')
        //    .replace(/<b>&nbsp;<\/b>/gi, '<b>&nbsp;&nbsp;</b>')
        //    .replace(/^(&nbsp;)*/gi, '');

        // Convert all middlot lists to UL lists
        var div = document.createElement("div");
        div.innerHTML = sContent;
        // Convert all middot paragraphs to li elements
        while (this._convertMiddots(div, "--list--")); // bull
        while (this._convertMiddots(div, middot, "unIndentedList")); // Middot
        while (this._convertMiddots(div, bull)); // bull
        sContent = div.innerHTML;
    
        return sContent.replace(/--list--/gi, ""); // Remove temporary --list--
    };

    this._convertMiddots = function(div, search, class_name) {
        var mdot = String.fromCharCode(183), bull = String.fromCharCode(8226);
        var nodes, prevul, i, p, ul, li, np, cp;

        nodes = div.getElementsByTagName("p");
        for (i = 0; i < nodes.length; i++) {
            p = nodes[i];

            // Is middot
            if (p.innerHTML.indexOf(search) != 0) continue;

            ul = document.createElement("ul");
            if (class_name)
                ul.className = class_name;

            // Add the first one
            li = document.createElement("li");
            li.innerHTML = p.innerHTML.replace(new RegExp('' + mdot + '|' + bull + '|--list--|&nbsp;', "gi"), '');
            ul.appendChild(li);

            // Add the rest
            np = p.nextSibling;
            while (np) {
                // If the node is whitespace, then
                // ignore it and continue on.
                if (np.nodeType == 3 && new RegExp('^\\s$', 'm').test(np.nodeValue)) {
                    np = np.nextSibling;
                    continue;
                }

                if (search == mdot) {
                    if (np.nodeType == 1 && new RegExp('^o(\\s+|&nbsp;)').test(np.innerHTML)) {
                        // Second level of nesting
                        if (!prevul) {
                            prevul = ul;
                            ul = document.createElement("ul");
                            prevul.appendChild(ul);
                        }
                        np.innerHTML = np.innerHTML.replace(/^o/, '');
                    }
                    else {
                        // Pop the stack if we're going back up to the first level
                        if (prevul) {
                            ul = prevul;
                            prevul = null;
                        }
                        // Not element or middot paragraph
                        if (np.nodeType != 1 || np.innerHTML.indexOf(search) != 0)
                            break;
                    }
                }
                else {
                    // Not element or middot paragraph
                    if (np.nodeType != 1 || np.innerHTML.indexOf(search) != 0)
                        break;
                }

                cp = np.nextSibling;
                li = document.createElement("li");
                li.innerHTML = np.innerHTML.replace(new RegExp('' + mdot + '|' + bull + '|--list--|&nbsp;', "gi"), '');
                np.parentNode.removeChild(np);
                ul.appendChild(li);
                np = cp;
            }
            p.parentNode.replaceChild(ul, p);
            return true;
        }
        return false;
    };
});

// #endif