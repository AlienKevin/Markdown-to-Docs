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
  replaceDeliminators(body, "__", boldStyle, false);
  
  const italicStyle = {};
  italicStyle[DocumentApp.Attribute.ITALIC] = true;
  replaceDeliminators(body, "\\*", italicStyle, false);
  replaceDeliminators(body, "_", italicStyle, false);
  
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
  replaceLinks(body);
  autoconvertLinks(body);
}

function autoconvertLinks(body){
  const regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g;
  const replacer = function (match, regex) {
    Logger.log(match[0].length)
    return [0, match[0].length];
  }
  const attributes = function (match) {
    const resultObject = {};
    resultObject[DocumentApp.Attribute.LINK_URL] = match[0];
    return resultObject;
  }
  replaceText(body, regex, replacer, attributes, false, resizeImage);
}

function replaceLinks(body){
  const capture = "(.+?)";
  const regex = new RegExp("\\[" + capture + "\\]\\(" + capture + "\\)", "g");
  const replacer = function (match, regex) {
    return [1, match[1].length + 1];
  }
  const attributes = function (match) {
    const resultObject = {};
    resultObject[DocumentApp.Attribute.LINK_URL] = match[2];
    return resultObject;
  }
  replaceText(body, regex, replacer, attributes, false, resizeImage);
}

function replaceHeaders(body, deliminator, attributes){
  var capture = "(.+?)";
  var regex = new RegExp(deliminator + " " + capture + "\n", "g");
  var replacer = function (match, regex) {
//    return match[1] + "\n";
    Logger.log("match[0]: " + match[0]);
    Logger.log("deliminator.length: " + deliminator.length);
    Logger.log("match[0].length: " + match[0].length);
    return [deliminator.length + 1, match[0].length];
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
      const deliminatorLength = deliminator.replace(/\\\\/g, "\\").replace(/\\/g, "").length;
      Logger.log("deliminator.length: " + deliminatorLength);
      Logger.log("match[0].length: " + match[0].length);
      Logger.log("match[0]: " + match[0]);
      return [deliminatorLength, match[0].length - deliminatorLength];
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
  var text = body.editAsText();
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
    Logger.log("start: " + start);
    Logger.log("end: " + end);
//    text.deleteText(start, end);
    var replaced = replacer(match, regex);
    Logger.log("replaced start: " + replaced[0]);
    Logger.log("replaced end: " + replaced[1]);
    Logger.log("start: " + start);
    Logger.log("end: " + end);
    var replaceStart = start + replaced[0];
    var replaceEnd = start + replaced[1];
    Logger.log("replaceStart: " + replaceStart);
    Logger.log("replaceEnd: " + replaceEnd);
    Logger.log("start: " + start);
    Logger.log("end: " + end);
    
    if (replaceStart - 1 >= start) {
      text.deleteText(start, replaceStart - 1);
    }
    Logger.log("text: " + body.getText());
    
    var deleted = replaceStart - start;
    Logger.log("deleted: " + deleted);
    
    var secondDeleteStart = replaceEnd - deleted;
    var secondDeleteEnd = end - deleted;
    Logger.log("secondDeleteStart: " + secondDeleteStart);
    Logger.log("secondDeleteEnd: " + secondDeleteEnd);
    if (secondDeleteEnd >= secondDeleteStart) {
      text.deleteText(secondDeleteStart, secondDeleteEnd);
    }
    Logger.log("text: " + body.getText());
    
    Logger.log("start: " + start);
    Logger.log("end: " + end);
    if (isImage) {
      var imageDoc = doc.newPosition(body.editAsText(), start).insertInlineImage(newContent);
      resizeImage(imageDoc);
    } else {
//      text.insertText(start, newContent);
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

function printObject(obj) {
  var str = "{";
  Object.keys(obj).forEach(function(key) {
    str += key + ": " + obj[key] + ",\n";
  });
  str += "}";
  Logger.log(str);
}

function resizeImage(image) {
  image.setWidth(image.getWidth() / 5);
  image.setHeight(image.getHeight() / 6);
}

function isFunction(functionToCheck) {
 return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function assign(target) {
  if (target === null || target === undefined) {
    throw new TypeError('Cannot convert undefined or null to object');
  }
  
  var to = Object(target);
  
  for (var index = 1; index < arguments.length; index++) {
    var nextSource = arguments[index];
    
    if (nextSource !== null && nextSource !== undefined) { 
      for (var nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}
