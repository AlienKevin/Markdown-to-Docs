function markdownToDocs() {

  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  
  // theme based on https://theme.typora.io/theme/Newsprint/
  const baseFontSize = 11;
  const baseFontFamily = "PT Serif";
  const baseBackgroundColor = "#f3f2ee";
  const baseForegroundColor = "#1f0909";
  
  // standardize font size and font family
  const allAttributes = {};
  allAttributes[DocumentApp.Attribute.FONT_SIZE] = baseFontSize;
  allAttributes[DocumentApp.Attribute.FONT_FAMILY] = baseFontFamily;
//  allAttributes[DocumentApp.Attribute.BACKGROUND_COLOR] = baseBackgroundColor;
  allAttributes[DocumentApp.Attribute.FOREGROUND_COLOR] = baseForegroundColor;
  setPageAttributes(body, allAttributes);
  
  const blockHighlightStyle = {};
  blockHighlightStyle[DocumentApp.Attribute.BACKGROUND_COLOR] = "#dadada";
  replaceDeliminators(body, "```", blockHighlightStyle, true);

  const inlineStyle = {};
  inlineStyle[DocumentApp.Attribute.FONT_FAMILY] = "Inconsolata";
  inlineStyle[DocumentApp.Attribute.BACKGROUND_COLOR] = "#dadada";
  replaceDeliminators(body, "`", inlineStyle, false);
  
  const boldStyle = {};
  boldStyle[DocumentApp.Attribute.BOLD] = true;
  replaceDeliminators(body, "\\*\\*", boldStyle, false);
  
  const italicStyle = {};
  italicStyle[DocumentApp.Attribute.ITALIC] = true;
  replaceDeliminators(body, "\\*", italicStyle, false);
  
  const strikethroughStyle = {}
  strikethroughStyle[DocumentApp.Attribute.STRIKETHROUGH] = true;
  replaceDeliminators(body, "~~", strikethroughStyle, false);
  
  // headers
  
  const sixthHeaderStyle = {};
  sixthHeaderStyle[DocumentApp.Attribute.FONT_SIZE] = baseFontSize;
  replaceHeaders(body, "######", sixthHeaderStyle, false); 
  
  const fifthHeaderStyle = {};
  fifthHeaderStyle[DocumentApp.Attribute.FONT_SIZE] = baseFontSize;
  fifthHeaderStyle[DocumentApp.Attribute.BOLD] = true;
  replaceHeaders(body, "#####", fifthHeaderStyle, false);
  
  const fourthHeaderStyle = {};
  fourthHeaderStyle[DocumentApp.Attribute.FONT_SIZE] = baseFontSize * 1.2;
  fourthHeaderStyle[DocumentApp.Attribute.BOLD] = true;
  replaceHeaders(body, "####", fourthHeaderStyle, false); 
    
  const thirdHeaderStyle = {};
  thirdHeaderStyle[DocumentApp.Attribute.FONT_SIZE] = baseFontSize * 1.5;
  replaceHeaders(body, "###", thirdHeaderStyle, false); 
  
  const secondHeaderStyle = {};
  secondHeaderStyle[DocumentApp.Attribute.FONT_SIZE] = baseFontSize * 1.5;
  secondHeaderStyle[DocumentApp.Attribute.BOLD] = true;
  replaceHeaders(body, "##", secondHeaderStyle, false); 
  
  const firstHeaderStyle = {};
  firstHeaderStyle[DocumentApp.Attribute.FONT_SIZE] = baseFontSize * 2;
  replaceHeaders(body, "#", firstHeaderStyle, false); 
  
  // links
  const linkStyle = {};
  replaceLink(body);
  
}

function replaceLink(body){
  const capture = "(.+?)";
  const regex = new RegExp("\\[" + capture + "\\]\\(" + capture + "\\)", "g");
  const replacer = function (match, regex) {
    return match[1];
  }
  const attributes = function (match) {
    const resultObject = {};
    resultObject[DocumentApp.Attribute.LINK_URL] = match[2];
    return resultObject;
  }
  replaceText(body, regex, replacer, attributes, false, resizeImage);
}

function replaceHeaders(body, deliminator, attributes){
  const capture = "(.+?)";
  const regex = new RegExp(deliminator + " " + capture + "\n", "g");
  const replacer = function (match, regex) {
    return match[1] + "\n";
  }
  replaceText(body, regex, replacer, attributes, false, resizeImage);
}

function replaceDeliminators(body, deliminator, attributes, multiline, replacer) {
  var capture;
  var isImage = true;
  if (multiline) {
    capture = "([\\s\\S]+?)";
  } else {
    capture = "([^*\\s].*?)";
  }
  const regex = new RegExp(deliminator + capture + deliminator, "g");
  if (replacer === undefined) {
    replacer = function (match, regex) {
      return match[1];
    }
    isImage = false;
  }
  replaceText(body, regex, replacer, attributes, isImage, resizeImage);
}

function setPageAttributes(body, pageAttributes) {
  const content = body.getText();
  const text = body.editAsText();
  
  text.setAttributes(0, content.length - 1, pageAttributes);
  
}

function replaceText(body, regex, replacer, attributes, isImage, resizeImage) {
  if (isImage === undefined) {
    isImage = false;
  }
  var doc = DocumentApp.getActiveDocument();
  var content = body.getText();
  const text = body.editAsText();
  var match = "";
  while (true) {
    content = body.getText();
    var oldLength = content.length;
    match = regex.exec(content);
    if (match === null) {
      break;
    }
    var start = match.index;
    var end = regex.lastIndex - 1;
    text.deleteText(start, end);
    var newContent = replacer(match, regex);
    Logger.log("newContent: " + newContent);
    
    Logger.log("start: " + start);
    Logger.log("end: " + end);
    if (isImage) {
      var imageDoc = doc.newPosition(body.editAsText(), start).insertInlineImage(newContent);
      resizeImage(imageDoc);
    } else {
      text.insertText(start, newContent);
    }
    Logger.log("Successfully inserted text!");
    var newLength = body.getText().length;
    var replacedLength = oldLength - newLength;
    var newEnd = end - replacedLength;
    if (attributes !== undefined) {
      if (isFunction(attributes)){ // attributes parameter can be a function (match is passed in as the argument)
        text.setAttributes(start, newEnd, attributes(match))
      } else{ // normal attributes
        text.setAttributes(start, newEnd, attributes);
      }
    }
    Logger.log("Successfully set attributes!");
    regex.lastIndex -= replacedLength;
  }
}

function resizeImage(image) {
  image.setWidth(image.getWidth() / 5);
  image.setHeight(image.getHeight() / 6);
}

function isFunction(functionToCheck) {
 return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}
