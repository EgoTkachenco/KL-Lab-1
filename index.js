const fs = require('fs');

// Український алфавіт
const ALPHABET = ['а', 'б', 'в', 'г', 'д', 'е', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о',
    'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'і', 'ї', 'ь', 'є', 'ю', 'я']

const ALPHABET_FREQ = {
    'а': 0.0807,
    'б': 0.0177,
    'в': 0.0535,
    'г': 0.0155,
    'д': 0.0338,
    'е': 0.0495,
    'ж': 0.0093,
    'з': 0.0232,
    'и': 0.0626,
    'й': 0.0138,
    'к': 0.0354,
    'л': 0.0369,
    'м': 0.0303,
    'н': 0.0681,
    'о': 0.0942,
    'п': 0.0290,
    'р': 0.0448,
    'с': 0.0424,
    'т': 0.0535,
    'у': 0.0336,
    'ф': 0.0028,
    'х': 0.0119,
    'ц': 0.0083,
    'ч': 0.0141,
    'ш': 0.0076,
    'щ': 0.0056,
    'і': 0.0575, 
    'ї': 0.0065,
    'ь': 0.0177,
    'є': 0.0061,
    'ю': 0.0093,
    'я': 0.0248
}

// Читаємо текст з файлу
function readText(filename) {
    try {
        let data = fs.readFileSync(filename, 'utf8')
        console.log('Файл \'' +
            filename.split('').splice(filename.lastIndexOf('/') + 1, filename.length).join('') + '\' успішно зчитанно');
        let result = data.split('').map(el => el.toLowerCase()).filter(el => ALPHABET.includes(el)).join('');
        return result;
    } catch (error) {
        console.log(filename, ' Error')        
    }
    
}

// Створити та записати файл
function saveToFile(fileName, data) {
    fs.writeFile(`${fileName}.json`, JSON.stringify(data), (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");
    }); 
}

// Отримати гістограму грамів
function gramHist(input) {
    let result = {};
    let text = input.split('').sort();
    for (let char of text) {
        if (result[char]) {
            result[char]++;
        } else {
            result[char] = 1;
        }
    }
    return { hist: result, size: text.length };
}

// Дістати пари символів з тексту
function getBigrams(text) {
    let result = [];
    for (let i = 0; i < text.length - 1; i++) {
        result.push([text[i], text[i + 1]]);
    }
    return result;
}

// Отримати гістограму біграмів
function bigramHist(bigrams) {
    let result = {};
    for (let bigram of bigrams) {
        if (result[bigram.join('')]) {
            result[bigram.join('')]++;
        } else {
            result[bigram.join('')] = 1;
        }
    }
    return { hist: result, size: bigrams.length };
}

// Отримати частоти
function getFreq(hist, size) {
    let result = {};
    for (let key in hist) {
        result[key] = hist[key] / size;
    }
    return result;
}

// Отримати середню частоту
function averageFreq(freqs) {
    let result = {};
    for (let freq of freqs) {
        for (let key in freq) {
            if (result[key]) {
                result[key] += freq[key];
            } else {
                result[key] = freq[key] ? freq[key] : 0;
            }
        }
    }

    for (let key in result) {
        result[key] = result[key] / freqs.length;
    }
    return result;
}

function getAuthorFunc(freqs, hists) {
    let allHist = {};

    for (hist of hists) {
        for (let key in hist.hist) {
            if (allHist[key]) {
                allHist[key] += hist.hist[key];
            } else {
                allHist[key] = hist.hist[key] ? hist.hist[key] : 0;
            }
        }
    }

    let result = {};

    for (item in allHist) {
        result[item] = (1 / allHist[item]) * (hists.reduce((s, hist, index) => {
            return hist.hist[item] ? s += (hist.hist[item] * freqs[index][item]) : s;
        }, 0));
    }
    return result;

}


function analizeAuthor(author, fileNames) {
    let mHists = [];
    let biHists = [];
    let mFreqs = [];
    let biFreqs = [];

    for (filename of fileNames) {
        let name = filename.split('').splice(filename.lastIndexOf('/') + 1, filename.length).join('');
        let text = readText(filename);
        console.log(name, ' size: ', text.length);
        let { hist: mHist, size: mSize } = gramHist(text);
        let { hist: biHist, size: biSize } = bigramHist(getBigrams(text))
        let biFreq = getFreq(biHist, biSize);
        let mFreq = getFreq(mHist, mSize);
        mHists.push({ name, hist: mHist});
        biHists.push({ name, hist: biHist });
        mFreqs.push(mFreq);
        biFreqs.push(biFreq);
    }

    let mFreqAverage = averageFreq(mFreqs);
    for (key in ALPHABET_FREQ) {
        mFreqAverage[key] = Math.abs(mFreqAverage[key] - ALPHABET_FREQ[key]);
    }
    let biFreqAverage = averageFreq(biFreqs);

    return {
        author,
        textsCount: fileNames.length,
        mHists: mHists,
        biHists: biHists,
        biFunc: getAuthorFunc(biFreqs, biHists),
        mFunc: getAuthorFunc(mFreqs, mHists),
        biFreq: biFreqAverage,
        mFreq: mFreqAverage,
        mFreqs, biFreqs
    };
}


function checkUnknownAuthor(text, authors) {
    // Аналізумо невідомий текст
    let { hist: mHist, size: mSize } = gramHist(text);
    let { hist: biHist, size: biSize } = bigramHist(getBigrams(text))
    let biFreq = getFreq(biHist, biSize);
    let mFreq = getFreq(mHist, mSize);
    
    let mFunc = getAuthorFunc([mFreq], [{ hist: mHist }]);
    let biFunc = getAuthorFunc([biFreq], [{ hist: biHist }]);

    // Знаходимо сумму різниць функцій невідомого тексту та відомих авторів
    let diffs = authors.map(author => {
        let sumM = Object.keys(author.mFunc).reduce((s, F) => {
            if (!author.mFunc[F]) return s;
            return s += Math.abs(mFunc[F] - author.mFunc[F]);
        }, 0);
        let sumBi = Object.keys(author.biFunc).reduce((s, F) => {
            if (!author.biFunc[F] || !biFunc[F]) {
                return s;
            }
            return s += biFunc[F]  - author.biFunc[F];
        }, 0);

        return { name: author.author, sumM: Math.abs(sumM), sumBi: Math.abs(sumBi)}
    })

    // console.log(diffs.name, diffs.sumM)
    
    // console.log(diffs.sort((a, b) => a.sumM - b.sumM))
    console.log(diffs.sort((a, b) => a.sumBi - b.sumBi))
}

a1 = analizeAuthor('Винниченко', ['./texts/Винниченко/Голота.txt', './texts/Винниченко/Поклади золота.txt', './texts/Винниченко/Чесність з собою.txt'])
a2 = analizeAuthor('Довженко', ['./texts/Довженко/Воля до життя.txt', './texts/Довженко/Зачарована Десна.txt', './texts/Довженко/Україна в огні.txt'])
a3 = analizeAuthor('Хвильовий', ['./texts/Хвильовий/Я (Романтика).txt', './texts/Хвильовий/Дорога й Ластівка.txt', './texts/Хвильовий/Сентиментальна історія.txt'])

saveToFile('Винниченко-analize', a1);
saveToFile('Довженко-analize', a2);
saveToFile('Хвильовий-analize', a3);

// a1 = require('./Винниченко-analize.json')
// a2 = require('./Довженко-analize.json')
// a3 = require('./Хвильовий-analize.json')


let text = readText('./texts/Довженко/Повість полум\'яних літ.txt');
function partStr(lim) {
    return text.split('').slice(0, lim).join('');
} 
checkUnknownAuthor(partStr(5000), [a1, a2, a3]);
checkUnknownAuthor(partStr(10000), [a1, a2, a3]);
checkUnknownAuthor(partStr(25000), [a1, a2, a3]);
checkUnknownAuthor(partStr(50000), [a1, a2, a3]);
