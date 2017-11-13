var gLastUrl = '';

function getPOSInformation(){
    var selector = $('.gt-cd.gt-cd-md > .gt-cd-c > .gt-cd-pos');
    var posIndexs = [];
    var posList = [];
    var posIndex = 0;
    for (var i = 0; i < selector.length; i++){
        var currentSelector = selector.eq(i);
        posIndex += currentSelector.next('.gt-def-list').children().length;  
        var pos = currentSelector.text();
        posIndexs.push(posIndex);
        posList.push(pos);
    }
    return {posIndexs: posIndexs, posList: posList};    
}

function getDefinitionInformation(){
    var selector = $('.gt-def-info');
    var text = [];
    var examples = [];
    var synonyms = [];
    for (var i = 0; i < selector.length; i++){
        var currentSelector = selector.eq(i);
        text.push(currentSelector.children('.gt-def-row').text());

        var example = currentSelector.children('.gt-def-example').text();
        if (example !== '') {
            example = '"' + example + '"';
        }
        examples.push(example);

        synonym = currentSelector.children('.gt-def-synonym').text();
        synonyms.push(synonym.substr(synonym.indexOf(':')+1, synonym.length-1));
    }
    return {text: text, examples: examples, synonyms: synonyms};
}

function getPreparedInformation(sourceText){
    var posInformation = getPOSInformation();
    var definitionInformation = getDefinitionInformation();
    var synonymTitle = $('.gt-def-synonym-title').eq(0).text();

    var toShowTitle = $('.gt-cd-md > .gt-cd-t > .gt-cd-tl > div').text()
                       .replace(sourceText, '<span id=gtp_bart ' +
			       'class="notranslate">' + sourceText + '</span>');

    //line feed by '; '
    var toTranslateText = definitionInformation.text.join('; |; ');
    toTranslateText += '; |; ' + posInformation.posList.join('; |; ') +
                       '; |; ' + synonymTitle + '; |; ' + toShowTitle;

    return {toTranslateText: toTranslateText,
            notToTranslateInformation: {posIndexs: posInformation.posIndexs,
                                        examples: definitionInformation.examples,
                                        synonyms: definitionInformation.synonyms}
           };
}
 
function showResult(data, notToTranslateInformation, sourceText){
    var translatedText = '';
    var i;
    for (i = 0; i < data[0].length; i++){
        translatedText += data[0][i][0];
    }

    var translatedTextList = translatedText.split('|');
    var translatedResultList = [];
    for (i = 0; i < translatedTextList.length; i++){
        var translatedResult = translatedTextList[i].trim();
	    if (translatedResult.indexOf(';') === 0){
	        translatedResult = translatedResult.substr(
		                            1, translatedResult.length);
	    }
        if (translatedResult.lastIndexOf(';') === translatedResult.length - 1){
            translatedResult = translatedResult.substr(
                                    0, translatedResult.length-1);
        }
        translatedResultList.push(translatedResult);
    }

    $('.gt-cd-c > .gt-def-list .gt-def-info > .gt-def-row').each(function(){
      ori_text = $(this).text();
      $(this).after('<div class="gtp-def-info">'+translatedResultList.shift()+'</div>');
    });
}

function translateDefinition(){
    var currentUrl = window.location.href;
    if (currentUrl === gLastUrl){
        return;
    }

    gLastUrl = currentUrl;

    if ($('.gt-cd-md:visible').length){
        var languages = currentUrl.split('#')[1].split('/');
        var fromLanguage = languages[0];
        var toLanguage = languages[1];

        var sourceText = $(
                '.gt-cd-md > .gt-cd-t > .gt-cd-tl > div > span').text();

        var preparedInformation = getPreparedInformation(sourceText);
        var toTranslateText = preparedInformation.toTranslateText;

        var translateUrl = 'https://translate.googleapis.com' +
                           '/translate_a/single?client=gtx' +
                           '&sl=' + fromLanguage + '&tl=' + toLanguage +
                           '&dt=t&q=' + encodeURI(toTranslateText);

        $.get(translateUrl, function(data, status){
            if (status === 'success'){
                showResult(data, preparedInformation.notToTranslateInformation,
                           sourceText);
            } else {
	    	console.log('translate failed');
	    }
        });
    }

}

var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function(mutation) {
        translateDefinition();
    });
});

//observe whether the definition change
observer.observe($('.gt-cd-md')[0], {attributes: true, characterData: true});

setTimeout(translateDefinition, 200);
