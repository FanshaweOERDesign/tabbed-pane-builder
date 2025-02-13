const previewChartContainer = document.getElementById('preview-tabbed-pane');
let currentlySelectedTabbedPane = document.getElementById('preview-tabbed-pane').querySelector('div.custom-tab-container');
let currentlySelectedTab = "";
let formatBlockChanged = false;

class Tab {
  constructor(tabText, content) {
    this.tabText = tabText;
    this.content = content;
    this.tabNumber = -1;
  }
}

class TabbedPane {
  static tabMap = {};
  static cssRules = {};
  static undoStack = [];
  static pageId = null;
  static defaultTabBg = "#b3272d";
  static defaultTabSelectedBg = "#646469";
  static defaultTabColor = "#ffffff";
  static defaultTabSelectedColor = "#ffffff";
  static defaultBodyBg = "#ffffff";
  static defaultBodyColor = "#000000";


  constructor(defaultBg = TabbedPane.defaultTabBg, selectedBg = TabbedPane.defaultTabSelectedBg, defaultColor = TabbedPane.defaultTabColor, selectedColor = TabbedPane.defaultTabSelectedColor, bodyBg = TabbedPane.defaultBodyBg, bodyColor = TabbedPane.defaultBodyColor, vertical = false) {
    this.defaultBg = defaultBg;
    this.selectedBg = selectedBg;
    this.defaultColor = defaultColor;
    this.selectedColor = selectedColor;
    this.bodyBg = bodyBg;
    this.bodyColor = bodyColor;
    this.vertical = vertical;

    this.tabs = [new Tab("Tab 1", "Tab Content 1"), new Tab("Tab 2", "Tab Content 2"), new Tab("Tab 3", "Tab Content 3")];

    TabbedPane.addTabbedPane(this);
  }

  addTab(tab) {
    this.tabs.push(tab);
  }

  removeTab(tabIdx) {
    if (!tabIdx) {
      this.tabs.pop();
      return;
    }
    this.tabs.splice(tabIdx, 1);
  }

  // static backup() {
  //   let currentState = {
  //     tabMap: Object.assign({}, TabbedPane.tabMap),
  //     pageId: TabbedPane.pageId,
  //     cssRules: Object.assign({}, TabbedPane.cssRules)
  //   };
  //   TabbedPane.undoStack.push(currentState);
  //   console.info("backup: %o", TabbedPane.undoStack);
  // }

  // static undo() {
  //   if (TabbedPane.undoStack.length > 0) {
  //     let prevState = TabbedPane.undoStack.pop();
  //     console.info("prevState: %o", prevState);
  //     TabbedPane.tabMap = Object.assign({},prevState.tabMap);
  //     TabbedPane.pageId = prevState.pageId;
  //     TabbedPane.cssRules = Object.assign({}, prevState.cssRules);
  //     TabbedPane.updateHTML(false);
  //     TabbedPane.generateCSSRules();
  //   }
  // }

  static renumberTabs() {
    let tabCount = 0;
    for (const [key, tabbedPane] of Object.entries(TabbedPane.tabMap)) {
      tabbedPane.tabs.forEach((tab, i) => {
        tab.tabNumber = ++tabCount;
      });
    }
  }

  

  static generateCSSRules() {
    const styleSheet = document.styleSheets[0];
    TabbedPane.cssRules = {};
    TabbedPane.cssRules[`.${TabbedPane.pageId}-custom-tab-container`] = {web: 'display: flex; \nflex-direction: column;', pdf:""};
    TabbedPane.cssRules[`.${TabbedPane.pageId}-custom-tab-container .tab-row`] = {web: 'display: flex; \ngap: 0.1em;', pdf:""};
    TabbedPane.cssRules[`.${TabbedPane.pageId}-custom-tab`] = {web:`\npadding: 15px; border-top-left-radius: 15px; \nborder-top-right-radius: 15px;\ntext-align: center;`, pdf:"display: none;"};
    TabbedPane.cssRules[`.${TabbedPane.pageId}-custom-tab:hover`] = {web: `cursor: pointer;`, pdf: ""};
    TabbedPane.cssRules[`.${TabbedPane.pageId}-custom-tab-content-container`] = {web: `display: grid; \ngrid-template-areas: "${TabbedPane.pageId}-grid-area";`, pdf: "display: block;"};
    TabbedPane.cssRules[`.${TabbedPane.pageId}-custom-tab-content`] = {web: `width: 90%; \nbackground-color: white; grid-area: ${TabbedPane.pageId}-grid-area; border-bottom-left-radius: 15px; \nborder-bottom-right-radius: 15px;`, pdf: "display: block;"};
    let tabsNumbered = true;
    for (const [key, tabbedPane] of Object.entries(TabbedPane.tabMap)) {
      //Vertical tabs
      if (tabbedPane.vertical) {
      TabbedPane.cssRules[`#${key}`] = {web: `display: flex; \nflex-direction: row; height: 100%;`, pdf: ""};
      TabbedPane.cssRules[`#${key} .tab-row`] = {web: `display: flex;\nalign-items: stretch;\ngap: 0.1em;\nflex-direction: column;\nwidth:fit-content;`, pdf: "display: none;"};
      TabbedPane.cssRules[`#${key} .${TabbedPane.pageId}-custom-tab`] = {web: `\npadding: 15px; border-radius: 15px; min-width: 5em;`, pdf: "display: none;"};
      TabbedPane.cssRules[`#${key} .${TabbedPane.pageId}-custom-tab-content-container`] = {web: `border: 1px solid ${tabbedPane.selectedBg}; \nborder-radius: 15px; \nmargin-left: 0.5em; \nwidth: 100%;`, pdf: ""};
      TabbedPane.cssRules[`#${key} .${TabbedPane.pageId}-custom-tab-content`] = {web: `border-radius: 15px;`, pdf: ""};  
    } else {
        TabbedPane.cssRules[`#${key}`] = {web: `display: flex; \nflex-direction: column;`, pdf: ""};
        TabbedPane.cssRules[`#${key} .tab-row`] = {web: `display: flex; \ngap: 0.1em;`, pdf: "display: none;"};
        TabbedPane.cssRules[`#${key} .${TabbedPane.pageId}-custom-tab`] = {web: `\npadding: 15px; border-top-right-radius: 15px; \nborder-top-left-radius: 15px;`, pdf: "display: none;"};
        TabbedPane.cssRules[`#${key} .${TabbedPane.pageId}-custom-tab-content-container`] = {web: `border: 1px solid ${tabbedPane.selectedBg};\nborder-top: 0px;\nborder-bottom-left-radius: 15px;\nborder-bottom-right-radius: 15px;`, pdf: ""};
        TabbedPane.cssRules[`#${key} .${TabbedPane.pageId}-custom-tab-content`] = {web: `border-bottom-left-radius: 15px;\nborder-bottom-right-radius: 15px;`, pdf: ""};
      }
      tabbedPane.tabs.forEach((tab, i) => {
        if (tab.tabNumber === -1) {
          tabsNumbered = false;
        }
      });
    }
    if (!tabsNumbered) {
      TabbedPane.updateHTML();
    }

    for (const [key, tabbedPane] of Object.entries(TabbedPane.tabMap)) {
      TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-content-container${key}`] = {web: `border: 1px solid ${tabbedPane.selectedBg};\nborder-top: 0px;\nborder-bottom-left-radius: 15px;\nborder-bottom-right-radius: 15px;`, pdf: ""};
      tabbedPane.tabs.forEach((tab, i) => {
        

        if (i === 0) {
          TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-content-${key}-${tab.tabNumber}`] = {web: `z-index: 1;\npadding: 2em 5%; background-color: ${tabbedPane.bodyBg};\ncolor: ${tabbedPane.bodyColor};`, pdf: `margin-bottom: 0.5em;`};
          TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-content-${key}-${tab.tabNumber}::before`] = {web: ``, pdf: `content: "${tab.tabText}";\ndisplay: block; font-size: 1.5em;\nfont-weight: bold;\nmargin-bottom: 0.5em;`};
          if (tabbedPane.vertical) {
            TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-${key}-${tab.tabNumber}`] = {web: `background-color: ${tabbedPane.selectedBg};\ncolor: ${tabbedPane.selectedColor};\nheight: ${100.0 / tabbedPane.tabs.length}%;`, pdf: "display: none;"};
          } else {
          TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-${key}-${tab.tabNumber}`] = {web: `background-color: ${tabbedPane.selectedBg};\ncolor: ${tabbedPane.selectedColor};\nwidth: ${100.0 / tabbedPane.tabs.length}%;`, pdf: "display: none;"};
          }
        } else {
          TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-content-${key}-${tab.tabNumber}`] = {web: `z-index: 0;\nbackground-color: ${tabbedPane.bodyBg};\ncolor: ${tabbedPane.bodyColor};\npadding: 2em 5%;`, pdf: "margin-bottom: 0.5em;"};
          TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-content-${key}-${tab.tabNumber}::before`] = {web: ``, pdf: `content: "${tab.tabText}";\nbackground-color:${tabbedPane.bodyBg};\ncolor:${tabbedPane.bodyColor};\ndisplay: block;\nfont-size: 1.5em;\nfont-weight: bold;\nmargin-bottom: 0.5em;`};
        }

        TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-content-${key}-${tab.tabNumber}:focus-within`] = {web: `z-index: 1;\npadding: 2em 5%;\nbackground-color: ${tabbedPane.bodyBg};\ncolor: ${tabbedPane.bodyColor};`, pdf: ""};
        if (tabbedPane.vertical) {
          TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-${key}-${tab.tabNumber}`] = {web: `background-color: ${tabbedPane.defaultBg};\ncolor: ${tabbedPane.defaultColor};\nflex-grow: 1;`, pdf: "display: none;"};
        } else {
        TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-${key}-${tab.tabNumber}`] = {web: `background-color: ${tabbedPane.defaultBg};\ncolor: ${tabbedPane.defaultColor};\nwidth: ${100.0 / tabbedPane.tabs.length}%;`, pdf: "display: none;"};
        }
        TabbedPane.cssRules[`#${TabbedPane.pageId}-custom-tab-${key}-${tab.tabNumber}:focus`] = {web: `background-color: ${tabbedPane.selectedBg};\ncolor: ${tabbedPane.selectedColor};`, pdf: ""};
        TabbedPane.cssRules[`.${TabbedPane.pageId}-custom-tab-container:has(#${TabbedPane.pageId}-custom-tab-${key}-${tab.tabNumber}:focus) #${TabbedPane.pageId}-custom-tab-content-${key}-${tab.tabNumber}`] = {web: `z-index: 1;\npadding: 2em 5%;\nbackground-color: ${tabbedPane.bodyBg};\ncolor: ${tabbedPane.bodyColor};`, pdf: ""};
        TabbedPane.cssRules[`.${TabbedPane.pageId}-custom-tab-container:has(#${TabbedPane.pageId}-custom-tab-content-${key}-${tab.tabNumber}:focus) #${TabbedPane.pageId}-custom-tab-${key}-${tab.tabNumber}`] = {web: `background-color: ${tabbedPane.selectedBg};`, pdf: ""};
        
        tabbedPane.tabs.forEach((sibling, j) => {
          if (sibling.tabNumber === tab.tabNumber) {
            return;
          }
          TabbedPane.cssRules[`.${TabbedPane.pageId}-custom-tab-container:has(#${TabbedPane.pageId}-custom-tab-${key}-${tab.tabNumber}:focus) #${TabbedPane.pageId}-custom-tab-content${sibling.tabNumber}`] = {web: `z-index: 0;`, pdf: ""};
        });
      });
    }

    for (const [key, rule] of Object.entries(TabbedPane.cssRules)) {
      for (let i = 0; i < styleSheet.cssRules.length; i++) {
        if (styleSheet.cssRules[i].selectorText === key) {
          styleSheet.deleteRule(i); // Remove the rule
          break; // Stop after deleting to avoid index shifting
        }
      }

      styleSheet.insertRule(`${key} {${rule.web}}`, styleSheet.cssRules.length);
    }
  }

  static initializeTabMap(pageId) {
    TabbedPane.pageId = pageId;
    TabbedPane.tabMap = {};
    TabbedPane.tabMap[`${TabbedPane.pageId}-tab_pane1`] = new TabbedPane();
    TabbedPane.generateCSSRules();
  }

  static addTabbedPane(tabbedPane) {
    const paneId = `${TabbedPane.pageId}-tab_pane${Object.keys(TabbedPane.tabMap).length + 1}`;
    TabbedPane.tabMap[paneId] = tabbedPane;
  }

  static removeTabbedPane(tabbedPane) {
    delete TabbedPane.tabMap[tabbedPane];
  }

  static changeColours(defaultBg, defaultTabColor, selectedBg, selectedTabColor, bodyBg, bodyColor) {
    for (const [key, tabbedPane] of Object.entries(TabbedPane.tabMap)) {
      tabbedPane.defaultBg = defaultBg;
      tabbedPane.selectedBg = selectedBg;
      tabbedPane.defaultColor = defaultTabColor;
      tabbedPane.selectedColor = selectedTabColor;
      tabbedPane.bodyBg = bodyBg;
      tabbedPane.bodyColor = bodyColor;
    }
  }

  static updateHTML() {
    
    let html = "";
    for (const [key, tabbedPane] of Object.entries(TabbedPane.tabMap)) {
      html += `<!-- Tabbed Pane ${key} -->`
      html += `<div class="${TabbedPane.pageId}-custom-tab-container" id="${key}">
                    <div class="tab-row">`;
      tabbedPane.tabs.forEach((tab, i) => {
        let tabText = tab.tabText;
        if (document.getElementById(`${TabbedPane.pageId}-custom-tab-${key}-${i + 1}`)) {
          tabText = document.getElementById(`${TabbedPane.pageId}-custom-tab-${key}-${i + 1}`).innerHTML;
          tab.tabText = tabText;
          //console.log('Tab text: ' + tabText);
        }
        html += `<div id="${TabbedPane.pageId}-custom-tab-${key}-${i + 1}" class="${TabbedPane.pageId}-custom-tab" tabindex="1" contentEditable="true">${tabText}</div>`;
        tab.tabNumber = i + 1;
      });
      html += `</div>
                    <div class="${TabbedPane.pageId}-custom-tab-content-container" id="${TabbedPane.pageId}-custom-tab-content-container${key}">`;
      tabbedPane.tabs.forEach((tab, i) => {
        let tabContent = tab.content;
        if (document.getElementById(`${TabbedPane.pageId}-custom-tab-content-${key}-${tab.tabNumber}`)) {
          tabContent = document.getElementById(`${TabbedPane.pageId}-custom-tab-content-${key}-${tab.tabNumber}`).innerHTML;
        }
        html += `<div id="${TabbedPane.pageId}-custom-tab-content-${key}-${tab.tabNumber}" class="${TabbedPane.pageId}-custom-tab-content" contentEditable="true" tabindex="1">${tabContent}</div>`;
      });
      html += `</div>
                </div>
                <div>&nbsp;</div>
                <!-- End of Tabbed Pane ${key} -->`;
              
    }
    return html;
  }

  static getCSS() {
    let css = `/*Custom tabs for page ${TabbedPane.pageId}*/`;
    let pdfCss = `/*Custom tabs for page ${TabbedPane.pageId}*/`;
    TabbedPane.generateCSSRules();

    for (const [key, rule] of Object.entries(TabbedPane.cssRules)) {
      if (rule.web.length > 0) {
      css += `\n\n${key} {\n${rule.web}\n}`;
      }

      if (rule.pdf.length > 0){
      pdfCss += `\n\n${key} {\n${rule.pdf}\n}`;
      }
    }

    css += `/*end of custom tabs for page ${TabbedPane.pageId}*/`;
    pdfCss += `/*end of custom tabs for page ${TabbedPane.pageId}*/`;
    return {web: css, pdf: pdfCss};
  }
}

// Initialize static property after class definition
TabbedPane.initializeTabMap();


const updateHTML = () => {

  const previewChartContainer = document.getElementById('preview-tabbed-pane');

  const tabBg = document.getElementById("tabDefaultBg").value;
  const tabColor = document.getElementById("tabColor").value;
  const tabActiveBg = document.getElementById("tabActiveBg").value;
  const tabActiveColor = document.getElementById("tabActiveColor").value;
  const bodyBg = document.getElementById("bodyBg").value;
  const bodyColor = document.getElementById("bodyColor").value;
  const selectedTabbedPane = TabbedPane.tabMap[currentlySelectedTabbedPane.id];
  const uniformColours = document.getElementById("uniformColours").checked;
  const verticalTabs = document.getElementById("verticalTabs").checked;

  if (uniformColours) {
    TabbedPane.changeColours(tabBg, tabColor, tabActiveBg, tabActiveColor, bodyBg, bodyColor);
  } else {
    if (selectedTabbedPane) {
      selectedTabbedPane.defaultBg = tabBg;
      selectedTabbedPane.selectedBg = tabActiveBg;
      selectedTabbedPane.defaultColor = tabColor;
      selectedTabbedPane.selectedColor = tabActiveColor;
      selectedTabbedPane.bodyBg = bodyBg;
      selectedTabbedPane.bodyColor = bodyColor;
      }
  }

  if (selectedTabbedPane) {
    //console.log('Vertical tabs: ' + verticalTabs);
    selectedTabbedPane.vertical = verticalTabs;
  }

  previewChartContainer.innerHTML = TabbedPane.updateHTML();
  addListeners();
  generateCSS();
  generateHTML();
};

const addListeners = () => {

  const previewContainer = document.getElementById("preview-tabbed-pane");
  const tabs = previewContainer.querySelectorAll(`.${TabbedPane.pageId}-custom-tab`);
  for (const tab of tabs){
    tab.addEventListener('click', (e)=>{
      //add logic to update the tabmap here
      currentlySelectedTab = e.target.id;
    })
  }

  let wrappers = previewContainer.querySelectorAll(`div.${TabbedPane.pageId}-custom-tab-container`);
  for (let wrapper of wrappers) {
    wrapper.addEventListener("click", () => { setSelectedTabbedPane(wrapper) });
  }
}

function rgbToHex(rgb) {

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  //check if already in hex format
  if (rgb.indexOf('#') === 0) {
    return rgb;
  }
  let vals = rgb.substring(rgb.indexOf('(') + 1, rgb.indexOf(')')).split(',');
  let hex = "#";
  for (const val of vals) {
    if (!val || val.length === 0) {
      continue;
    }
    hex += componentToHex(Number.parseInt(val.trim()));
  }
  return hex;
}

// class UndoManager {
//   constructor() {

//     this._undoStack = [];
//     this._idx = 0;
//     this.backup = function () {

//       let currentState = {
//         headerBg: rgbToHex(document.getElementById("headerBg").value),
//         headerColor: rgbToHex(document.getElementById("headerColor").value),
//         bodyBg: rgbToHex(document.getElementById("bodyBg").value),
//         bodyColor: rgbToHex(document.getElementById("bodyColor").value),
//         numAccordions: document.getElementById("numAccordions").value,
//         html: document.getElementById('preview-tabbed-pane').innerHTML
//       };
//       this._undoStack.splice(this._idx + 1);
//       this._undoStack.push(currentState);
//       this._idx = this._undoStack.length - 1;
//       console.info("backup: %o", this._undoStack);
//     };

//     this.undo = function () {

//       console.log("idx: " + this._idx);

//       if (this._idx === 0) {

//         return;
//       }

//       let prevState = this._undoStack[--this._idx];

//       //console.info("prevState: %o", prevState);
//       setColourSelectors(prevState.headerBg, prevState.headerColor, prevState.bodyBg, prevState.bodyColor);
//       document.getElementById("numAccordions").value = prevState.numAccordions;
//       document.getElementById('preview-tabbed-pane').innerHTML = prevState.html;
//       document.getElementById('preview-tabbed-pane').addEventListener("keyup", () => { this.backup(); });
//     };

//     this.redo = function () {

//       if (this._idx === this._undoStack.length - 1) {

//         return;
//       }

//       let redoState = this._undoStack[++this._idx];

//       setColourSelectors(redoState.headerBg, redoState.headerColor, redoState.bodyBg, redoState.bodyColor);
//       document.getElementById('preview-tabbed-pane').innerHTML = redoState.html;
//       document.getElementById('preview-tabbed-pane').addEventListener("keyup", () => { this.backup(); });
//       document.getElementById('numAccordions').value = redoState.numAccordions;
//       generateHTML();
//     };
//   }
// }


let undoManager;

function applyBlockFormatting(format) {
  const selection = window.getSelection();

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    let parentNode = range.startContainer.parentElement;
    //console.log("range: " + range.toString());
    if (parentNode.tagName === 'SPAN' || ((parentNode.tagName[0] === 'H') && parentNode.innerHTML === range.toString())) {

      const span = document.createElement(format);
      span.innerHTML = parentNode.innerHTML;
      parentNode.parentElement.replaceChild(span, parentNode);

    }
    else {
      const selectedText = range.extractContents();
      const span = document.createElement(format);
      span.appendChild(selectedText);

      range.insertNode(span);
    }
    const correspondingContentId = currentlySelectedTab.slice(0, currentlySelectedTab.indexOf('tab-tab')) + 'tab-content-tab' + currentlySelectedTab.slice(currentlySelectedTab.indexOf('tab-tab') + 7);
    //console.log(correspondingContentId);
    document.getElementById(correspondingContentId).style = "";
    formatBlockChanged = true;
    updateHTML();
  }
}

function removeTagKeepContents(element) {
  if (element) {
    // Move all child nodes out of the element
    while (element.firstChild) {
      element.parentNode.insertBefore(element.firstChild, element);
    }
    // Remove the empty element
    element.parentNode.removeChild(element);
  }
}


function generateHTML() {


  let editorContent = document.getElementById('preview-tabbed-pane').innerHTML;
  editorContent = editorContent.replaceAll('contenteditable="true"', '');
  editorContent = editorContent.replaceAll('spellcheck="false"', '');
  editorContent = editorContent.replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>');
  editorContent = editorContent.replace(/<i>(.*?)<\/i>/g, '<em>$1</em>');
  editorContent = editorContent.replace(/<u>(.*?)<\/u>/g, '<span style="text-decoration: underline;">$1</span>');
  editorContent = editorContent.replace(/<u>(.*?)<\/u>/g, '<span style="text-decoration: underline;">$1</span>');
  editorContent = editorContent.replace('contenteditable="true"', '');

  // replace all rgb colours with hex
  editorContent = editorContent.replace(/rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/g, (match, r, g, b) => {
    return rgbToHex(`rgb(${r}, ${g}, ${b})`);
  });

  // make all inline styles important
  editorContent = editorContent.replace(/style="([^"]*)"/g, (match, style) => {

    const importantStyle = style.split(';').map((style) => {
      const [property, value] = style.split(':');
      if (!property || !value) {
        return '';
      }
      return `${property.trim()}: ${value.trim()} !important`;
    }).join(';');
    return `style="${importantStyle}"`;
  });
  const htmlOutput = document.getElementById('generated-html');
  const formattedHTML = html_beautify(editorContent);
  htmlOutput.textContent = formattedHTML;
  Prism.highlightElement(htmlOutput);
}

function rgbToHex(rgb) {

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  //check if already in hex format
  if (rgb.indexOf('#') === 0) {
    return rgb;
  }
  let vals = rgb.substring(rgb.indexOf('(') + 1, rgb.indexOf(')')).split(',');
  let hex = "#";
  for (const val of vals) {
    if (!val || val.length === 0) {
      continue;
    }
    hex += componentToHex(Number.parseInt(val.trim()));
  }
  return hex;
}

function setColourSelectors(tabBg, tab, tabActiveBg, tabActive, bodyBg, body) {

  let tabBgSelector = document.getElementById("tabDefaultBg");
  let tabColorSelector = document.getElementById("tabColor");
  let tabActiveBgSelector = document.getElementById("tabActiveBg");
  let tabActiveColorSelector = document.getElementById("tabActiveColor");
  let bodyBgSelector = document.getElementById("bodyBg");
  let bodyColorSelector = document.getElementById("bodyColor");

  tabBgSelector.value = tabBg.length > 0 ? tabBg : TabbedPane.defaultTabBg;
  tabColorSelector.value = tab.length > 0 ? tab : TabbedPane.defaultTabColor;
  bodyBgSelector.value = bodyBg.length > 0 ? bodyBg : TabbedPane.defaultBodyBg;
  bodyColorSelector.value = body.length > 0 ? body : TabbedPane.defaultBodyColor;
  tabActiveBgSelector.value = tabActiveBg.length > 0 ? tabActiveBg : TabbedPane.defaultTabSelectedBg;
  tabActiveColorSelector.value = tabActive.length > 0 ? tabActive : TabbedPane.defaultTabSelectedColor;

}

function setSelectedTabbedPane(tabpane) {

  currentlySelectedTabbedPane = tabpane;
  const tabbedPaneId = tabpane.id;
  //console.log('Tabpane id: ' + tabpane.id);
  //console.info("Tabmap: %o", TabbedPane.tabMap);
  const tabbedPane = TabbedPane.tabMap[tabbedPaneId];

  //get tab and tab content elements
  let tabs = tabpane.querySelectorAll(`.${TabbedPane.pageId}-custom-tab`);
  let tabContents = tabpane.querySelectorAll(`.${TabbedPane.pageId}-custom-tab-content`);

  setColourSelectors(tabbedPane.defaultBg, tabbedPane.defaultColor, tabbedPane.selectedBg, tabbedPane.selectedColor, tabbedPane.bodyBg, tabbedPane.bodyColor);
  const verticalTabs = document.getElementById("verticalTabs");
  verticalTabs.checked = tabbedPane.vertical;

  // set the tab number selector to the number of tabs
  document.getElementById('numTabs').value = tabbedPane.tabs.length;
}

function generateCSS() {
  const cssOutput = document.getElementById('generated-css');
  const pdfCssOutput = document.getElementById('generated-pdf-css');
  //update tab text
  for (const [key, tabbedPane] of Object.entries(TabbedPane.tabMap)) {
    tabbedPane.tabs.forEach((tab, i) => {
      console.log("Tab: " + `${TabbedPane.pageId}-custom-tab-${key}-${tab.tabNumber}`);
      const tabElement = document.getElementById(`${TabbedPane.pageId}-custom-tab-${key}-${tab.tabNumber}`);
      if (tabElement) {
        console.log("Found tab element: " + tabElement);
        tab.tabText = tabElement.innerHTML;
      }
    });
  }

  const generatedCSS = TabbedPane.getCSS();
  cssOutput.textContent = generatedCSS.web;
  pdfCssOutput.textContent = generatedCSS.pdf;
  Prism.highlightElement(cssOutput);
  Prism.highlightElement(pdfCssOutput);
}

function execCmd(command, value = null) {

  if (command === 'createLink') {
    const url = prompt("Enter the URL");
    if (url) {
      document.execCommand(command, false, url);
    }
  } else {


    if (command === 'undo') {

      undoManager.undo();

    } else if (command === 'redo') {

      undoManager.redo();
    }
    else {

      document.execCommand(command, false, value);
    }
  }
  updateHTML();
}

// Need to track the total number of tabs so that ids are unique
// These need to be reflected in the CSS as well as the HTML
function setNumber(num) {

  const currentNum = Object.keys(TabbedPane.tabMap).length;
  if (num > currentNum) {
    for (let i = 0; i < num - currentNum; i++) {
      const tabbedPane = new TabbedPane();
    }
  } else if (num < currentNum) {
    for (let i = 0; i < currentNum - num; i++) {
      const lastTabbedPane = Object.keys(TabbedPane.tabMap).pop();
      TabbedPane.removeTabbedPane(lastTabbedPane);
    }
  }

  updateHTML();

}

function setTabNumber(num) {

  const currentNum = TabbedPane.tabMap[currentlySelectedTabbedPane.id].tabs.length;
  if (num > currentNum) {
    for (let i = 0; i < num - currentNum; i++) {
      TabbedPane.tabMap[currentlySelectedTabbedPane.id].addTab(new Tab(`Tab ${currentNum + i + 1}`, `Tab Content ${currentNum + i + 1}`));
    }
  } else if (num < currentNum) {
    for (let i = 0; i < currentNum - num; i++) {
      TabbedPane.tabMap[currentlySelectedTabbedPane.id].removeTab();
    }
  }

  updateHTML();

}

function openTab(evt, tab) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tab).style.display = "block";
  evt.currentTarget.className += " active";
}

function copy(id) {
  let codeText = document.getElementById(id).textContent;
  navigator.clipboard.writeText(codeText);
  const copyButton = document.getElementById(`btn-copy-${id}`);
  const originalText = '<i class="fa-regular fa-copy"></i>Copy';
  copyButton.innerHTML = '<i class="fa-solid fa-check"></i>Copied!';

  setTimeout(() => {
    copyButton.innerHTML = originalText;
  }, 2000);
}

function startup() {
  const colourSelectors = document.querySelectorAll("input[type=color]");
  for (let c of colourSelectors) {
    c.addEventListener("change", updateHTML);
    switch (c.id) {
      case "tabDefaultBg":
        c.value = TabbedPane.defaultTabBg;
        break;
      case "tabColor":
        c.value = TabbedPane.defaultTabColor;
        break;
      case "tabActiveBg":
        c.value = TabbedPane.defaultTabSelectedBg;
        break;
      case "tabActiveColor":
        c.value = TabbedPane.defaultTabSelectedColor;
        break;
      case "bodyBg":
        c.value = TabbedPane.defaultBodyBg;
        break;
      case "bodyColor":
        c.value = TabbedPane.defaultBodyColor;
        break;
    }
  }
    
  
  // undoManager = new UndoManager();
  // undoManager.backup();
  // document.getElementById('preview-tabbed-pane').addEventListener("keyup", () => {

  //   undoManager.backup();
  // });

  const previewPane = document.getElementById('preview-tabbed-pane');
  previewPane.style.display = 'none';
  previewPane.addEventListener('input', () => {
    generateHTML();
    generateCSS();
  });

  const modalNewPageBtn = document.getElementById('new-page-modal');
  modalNewPageBtn.addEventListener('click', () => {
    const modal = document.getElementById('modal');
    const pageId = document.getElementById('pageId').value;
    if (!pageId) {
      alert('Please enter a page id');
      return;
    }
    TabbedPane.initializeTabMap(pageId.replace(/\s+/g, '_'));
    generateCSS();
    updateHTML();
    generateHTML();
    
    
    
    previewPane.style.display = 'block';
    modal.style.display = 'none';
  });
  
}