// ==========================================
// 题目解析提取器与高精度题型匹配引擎（单选/多选/判断/填空）
// ==========================================

function parseQuestionsFromDom() {
    const questionList = [];
    const questionsElement = _d.getElementsByClassName('Py-mian1');

    for (let i = 0; i < questionsElement.length; i++) {
        const questionElement = questionsElement[i];
        const idElements = questionElement.getElementsByTagName('input');
        let questionId = '0';
        const titleElement = questionElement.getElementsByClassName('Py-m1-title fs16')[0];
        if (!titleElement) continue;

        let question = titleElement.innerHTML;
        question = handleImgs(question)
            .replace(/(<([^>]+)>)/ig, '')
            .replace(/[0-9]{1,3}\.[\[【](.*?)[\]】]/ig, '')
            .replace(/[0-9]{1,3}\.\[(.*?)\]/ig, '')
            .replace(/[\(（]\s*\d+(?:\.\d+)?\s*分\s*[\)）]/ig, '')
            .replaceAll('\n', '')
            .replace(/^\s+/ig, '').replace(/\s+$/ig, '');

        for (let z = 0, k = idElements.length; z < k; z++) {
            try {
                const nameAttr = idElements[z].getAttribute('name');
                if (nameAttr && nameAttr.indexOf('answer') >= 0) {
                    questionId = nameAttr.replace('type', '');
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        if (questionId === '0' || question === '') continue;

        const typeE = questionElement.getElementsByTagName('input');
        if (!typeE || typeE.length === 0) continue;

        let typeN = 'unknown';
        for (let g = 0, h = typeE.length; g < h; g++) {
            if (typeE[g].id === 'answertype' + questionId.replace('answer', '').replace('check', '')) {
                typeN = typeE[g].value;
                break;
            }
        }

        // 支持 0:单选, 1:多选, 2:填空, 3:判断
        if (['0', '1', '2', '3'].indexOf(typeN) < 0) {
            if (_w.top && _w.top.unrivalWorkInfo !== undefined) {
                _w.top.unrivalWorkInfo = '遇到暂不支持的题型(题型代码:' + typeN + ')，已跳过';
            }
            continue;
        }

        const type = {
            '0': '单选题',
            '1': '多选题',
            '2': '填空题',
            '3': '判断题'
        }[typeN];

        const optionList = { length: 0 };
        if (['单选题', '多选题'].indexOf(type) >= 0) {
            const answerListContainer = questionElement.getElementsByClassName('answerList')[0];
            if (answerListContainer) {
                const answersElements = answerListContainer.getElementsByTagName('li');
                for (let x = 0, j = answersElements.length; x < j; x++) {
                    const optionE = answersElements[x];
                    const emE = optionE.getElementsByTagName('em')[0];
                    let optionValue = emE ? (emE.getAttribute('id-param') || emE.innerText || emE.textContent || '').trim() : '';
                    const optionTextE = trim(optionE.innerHTML.replace(/(^\s*)|(\s*$)/g, ""));
                    const optionId = optionE.getAttribute('id-param');
                    if (!optionValue) {
                        optionValue = optionTextE.slice(0, 1).toUpperCase();
                    }
                    let optionText = optionTextE.replace(/^[A-Za-z][\.\、\:\s]*/, '').replace(/(^\s*)|(\s*$)/g, "");
                    if (!optionText) {
                        optionText = optionValue;
                    }
                    optionList[optionText] = {
                        'id': optionId,
                        'value': optionValue
                    };
                    optionList.length++;
                }
            }
        }

        questionList.push({
            'index': i,
            'question': question,
            'type': type,
            'typeCode': typeN,
            'questionid': questionId,
            'options': optionList
        });
    }

    return questionList;
}

// 统一答案填涂与题型精准匹配
function applyQuestionAnswer(res, quu, contextObj) {
    const { choiceEs, cleanQId, questionsElement, curRandomDo, curAccuracy, onAnswerMatched } = contextObj;
    const ctResult = res || { 'code': -1, 'data': '未找到答案' };

    try {
        if (ctResult['code'] !== 1) {
            _w.top.unrivalWorkInfo = '题目：' + quu['question'] + '：未搜索到答案';

            // 未命中答案时的盲猜机制（当允许盲猜且合格正确率不为100%时）
            if (curRandomDo == 1 && curAccuracy < 100) {
                if (quu['type'] === '判断题') {
                    _w.top.unrivalWorkInfo = quu['question'] + '：未找到答案，自动选【错】';
                    for (let u = 0, k = choiceEs.length; u < k; u++) {
                        if (choiceEs[u].getElementsByTagName('em').length < 1) continue;
                        if (choiceEs[u].getAttribute('val-param') === 'false' && choiceEs[u].getAttribute('id-param') === cleanQId) {
                            choiceEs[u].click();
                            return;
                        }
                    }
                } else if (quu['type'] === '单选题') {
                    _w.top.unrivalWorkInfo = quu['question'] + '：未找到答案，自动选【B】';
                    for (let y = 0, j = choiceEs.length; y < j; y++) {
                        const em = choiceEs[y].getElementsByTagName('em');
                        if (em.length < 1) continue;
                        const emLetter = (em[0].getAttribute('id-param') || em[0].innerText || '').trim();
                        if (emLetter === 'B' && choiceEs[y].getAttribute('id-param') === cleanQId) {
                            if (!choiceEs[y].getAttribute('class').includes('cur')) {
                                choiceEs[y].click();
                            }
                            return;
                        }
                    }
                } else if (quu['type'] === '多选题') {
                    _w.top.unrivalWorkInfo = quu['question'] + '：未找到答案，自动全选';
                    for (let y = 0, j = choiceEs.length; y < j; y++) {
                        if (choiceEs[y].getElementsByTagName('em').length < 1) continue;
                        if (choiceEs[y].getAttribute('id-param') === cleanQId) {
                            if (!choiceEs[y].getAttribute('class').includes('cur')) {
                                choiceEs[y].click();
                            }
                        }
                    }
                }
            }
            return;
        }

        const result = ctResult['data'];
        _w.top.unrivalWorkInfo = (ctResult['from'] ? '[' + ctResult['from'] + '] ' : '') + '题目：' + quu['question'] + '：' + (typeof result === 'object' ? JSON.stringify(result) : result);

        switch (quu['type']) {
            case '判断题': {
                let s = String(result).trim();
                s = s.replace(/^(?:答案|判断)[:：\s]*/i, '').replace(/[*_`【】\(\)\[\]"']/g, '').trim();
                const lower = s.toLowerCase();
                let answer = '';
                if (/^(?:错|×|错误|否|false|f|0|不对|不正确|不是)/i.test(lower) || /不正确|错误|为错|为假|false/i.test(lower)) {
                    answer = 'false';
                } else if (/^(?:对|√|正确|是|true|t|1)/i.test(lower) || /正确|为对|为真|true/i.test(lower)) {
                    answer = 'true';
                }

                if (answer) {
                    for (let u = 0, k = choiceEs.length; u < k; u++) {
                        if (choiceEs[u].getAttribute('val-param') === answer && choiceEs[u].getAttribute('id-param') === cleanQId) {
                            choiceEs[u].click();
                            onAnswerMatched();
                            return;
                        }
                    }
                }

                // 支持判断题返回 A / B 选项字母
                const letterMatch = s.match(/^([A-Ba-b])(?:\.|\、|\:|\s|$)/);
                if (letterMatch) {
                    const targetLtr = letterMatch[1].toUpperCase();
                    for (let u = 0, k = choiceEs.length; u < k; u++) {
                        const em = choiceEs[u].getElementsByTagName('em');
                        if (em.length < 1) continue;
                        const emLtr = (em[0].getAttribute('id-param') || em[0].innerText || '').trim().toUpperCase();
                        if (emLtr === targetLtr && choiceEs[u].getAttribute('id-param') === cleanQId) {
                            choiceEs[u].click();
                            onAnswerMatched();
                            return;
                        }
                    }
                }

                if (curRandomDo == 1 && curAccuracy < 100) {
                    _w.top.unrivalWorkInfo = quu['question'] + '：未匹配到判断结果，自动选【错】';
                    for (let u = 0, k = choiceEs.length; u < k; u++) {
                        if (choiceEs[u].getElementsByTagName('em').length < 1) continue;
                        if (choiceEs[u].getAttribute('val-param') === 'false' && choiceEs[u].getAttribute('id-param') === cleanQId) {
                            choiceEs[u].click();
                            return;
                        }
                    }
                }
                break;
            }

            case '单选题': {
                function clickOptionByLetter(letter) {
                    for (let y = 0, j = choiceEs.length; y < j; y++) {
                        const em = choiceEs[y].getElementsByTagName('em');
                        if (em.length < 1) continue;
                        const emLetter = (em[0].getAttribute('id-param') || em[0].innerText || '').trim();
                        if (emLetter.toUpperCase() === letter.toUpperCase() && choiceEs[y].getAttribute('id-param') === cleanQId) {
                            if (!choiceEs[y].getAttribute('class').includes('cur')) {
                                choiceEs[y].click();
                            }
                            return true;
                        }
                    }
                    return false;
                }

                const cleanRes = String(result).trim();
                const s = cleanRes.replace(/^(?:答案|正确答案|选项)[:：\s]*/i, '').replace(/[*_`【】\(\)\[\]"']/g, '').trim();

                // 1. 优先尝试选项字母匹配（如 "A", "A.", "选项A", "A、"）
                const letterMatch = s.match(/^([A-Za-z])(?:\.|\、|\:|\s|$)/i);
                if (letterMatch) {
                    const targetLetter = letterMatch[1].toUpperCase();
                    if (clickOptionByLetter(targetLetter)) {
                        onAnswerMatched();
                        return;
                    }
                }

                // 2. 全文本精准相等匹配（无标点空格降噪后）
                const cleanResText = cleanText(s);
                for (let option in quu['options']) {
                    if (option === 'length') continue;
                    const cleanOpt = cleanText(option);
                    if (cleanOpt && cleanResText && cleanOpt === cleanResText) {
                        if (clickOptionByLetter(quu['options'][option]['value'])) {
                            onAnswerMatched();
                            return;
                        }
                    }
                }

                // 3. 文本长子串包含匹配（按选项长度从长到短优先匹配，且要求子串长 >= 2）
                const sortedOptions = Object.keys(quu['options']).filter(k => k !== 'length').sort((a, b) => b.length - a.length);
                for (let option of sortedOptions) {
                    const cleanOpt = cleanText(option);
                    if (cleanOpt && cleanResText && cleanOpt.length >= 2 && (cleanOpt.includes(cleanResText) || cleanResText.includes(cleanOpt))) {
                        if (clickOptionByLetter(quu['options'][option]['value'])) {
                            onAnswerMatched();
                            return;
                        }
                    }
                }

                // 4. 盲猜
                if (curRandomDo == 1 && curAccuracy < 100) {
                    _w.top.unrivalWorkInfo = quu['question'] + '：未匹配到正确答案，自动选【B】';
                    clickOptionByLetter('B');
                }
                break;
            }

            case '多选题': {
                function clickOptionByLetter(letter) {
                    for (let y = 0, j = choiceEs.length; y < j; y++) {
                        const em = choiceEs[y].getElementsByTagName('em');
                        if (em.length < 1) continue;
                        const emLetter = (em[0].getAttribute('id-param') || em[0].innerText || '').trim();
                        if (emLetter.toUpperCase() === letter.toUpperCase() && choiceEs[y].getAttribute('id-param') === cleanQId) {
                            if (!choiceEs[y].getAttribute('class').includes('cur')) {
                                choiceEs[y].click();
                            }
                            return true;
                        }
                    }
                    return false;
                }

                const matchedLetters = new Set();
                if (Array.isArray(result)) {
                    for (let item of result) {
                        const itemStr = String(item).trim().replace(/[*_`【】\(\)\[\]"']/g, '').trim();
                        if (/^[A-Za-z]$/.test(itemStr)) {
                            matchedLetters.add(itemStr.toUpperCase());
                        } else {
                            const cleanItem = cleanText(itemStr);
                            for (let option in quu['options']) {
                                if (option === 'length') continue;
                                const cleanOpt = cleanText(option);
                                if (cleanOpt && cleanItem && (cleanOpt === cleanItem || (cleanOpt.length >= 2 && cleanItem.includes(cleanOpt)))) {
                                    matchedLetters.add(quu['options'][option]['value']);
                                }
                            }
                        }
                    }
                } else if (typeof result === 'string') {
                    const s = result.trim().replace(/^(?:答案|正确答案|选项)[:：\s]*/i, '').replace(/[*_`【】\(\)\[\]"']/g, '').trim();
                    if (/^[A-Za-z\s,#、|&;]+$/.test(s)) {
                        const letters = s.toUpperCase().match(/[A-Z]/g);
                        if (letters && letters.length > 0) {
                            letters.forEach(ltr => matchedLetters.add(ltr));
                        }
                    } else {
                        const answerData = cleanText(s);
                        const sortedOptions = Object.keys(quu['options']).filter(k => k !== 'length').sort((a, b) => b.length - a.length);
                        for (let option of sortedOptions) {
                            const optTextClean = cleanText(option);
                            if (optTextClean && answerData && (optTextClean.length >= 2 && (answerData.includes(optTextClean) || optTextClean.includes(answerData)))) {
                                matchedLetters.add(quu['options'][option]['value']);
                            }
                        }
                    }
                }

                let hasAnswer = false;
                if (matchedLetters.size > 0) {
                    matchedLetters.forEach(ltr => {
                        if (clickOptionByLetter(ltr)) hasAnswer = true;
                    });
                }

                if (hasAnswer) {
                    onAnswerMatched();
                } else if (curRandomDo == 1 && curAccuracy < 100) {
                    _w.top.unrivalWorkInfo = quu['question'] + '：未匹配到正确答案，自动全选';
                    for (let option in quu['options']) {
                        if (option === 'length') continue;
                        clickOptionByLetter(quu['options'][option]['value']);
                    }
                }
                break;
            }

            case '填空题': {
                let qEl = questionsElement[quu['index']];
                if (!qEl) {
                    qEl = _d.getElementById('question' + cleanQId) || questionsElement[0];
                }
                let inputEs = qEl ? qEl.querySelectorAll('textarea, input[type="text"]') : [];
                if (!inputEs || inputEs.length === 0) {
                    inputEs = qEl ? qEl.getElementsByTagName('textarea') : [];
                }
                if (!inputEs || inputEs.length === 0) {
                    inputEs = qEl ? Array.from(qEl.getElementsByTagName('input')).filter(el => {
                        const t = (el.getAttribute('type') || 'text').toLowerCase();
                        return t === 'text' || t === '';
                    }) : [];
                }
                if (inputEs && inputEs.length > 0) {
                    let answers = [];
                    if (Array.isArray(result)) {
                        answers = result;
                    } else if (typeof result === 'string') {
                        const s = result.trim().replace(/^(?:答案|正确答案)[:：\s]*/i, '');
                        if (inputEs.length > 1) {
                            if (s.includes('###')) answers = s.split('###');
                            else if (s.includes('===')) answers = s.split('===');
                            else if (s.includes('#')) answers = s.split('#');
                            else if (s.includes('|')) answers = s.split('|');
                            else if (s.includes('\n')) answers = s.split('\n');
                            else answers = [s];
                        } else {
                            answers = [s];
                        }
                    } else {
                        answers = [String(result)];
                    }
                    let filledCount = 0;
                    for (let b = 0; b < inputEs.length; b++) {
                        let ans = (answers[b] !== undefined ? answers[b] : answers[0]) || '';
                        ans = trim(ans).replace(/^(答案[:：]|\d+[\.、])/g, '').replace(/[*_`]/g, '').trim();
                        inputEs[b].value = ans;
                        inputEs[b].dispatchEvent(new Event('input', { bubbles: true }));
                        inputEs[b].dispatchEvent(new Event('change', { bubbles: true }));
                        filledCount++;
                    }
                    if (filledCount > 0) {
                        onAnswerMatched();
                    }
                }
                break;
            }
        }
    } catch (e) {
        console.log(e);
    }
}
