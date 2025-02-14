//ytplayer.config.args.raw_player_response

function getInitialFunctionName(js, jsUrl) {
    // Array of function patterns
    const functionPatterns = [
        /([a-zA-Z0-9_$]+)\s*=\s*function\(\s*([a-zA-Z0-9_$]+)\s*\)\s*{\s*\2\s*=\s*\2\.split\(\s*""\s*\)\s*;\s*[^}]+;\s*return\s+\2\.join\(\s*""\s*\)/,
        /(?:\b|[^a-zA-Z0-9_$])([a-zA-Z0-9_$]{2,})\s*=\s*function\(\s*a\s*\)\s*{\s*a\s*=\s*a\.split\(\s*""\s*\)(?:;[a-zA-Z0-9_$]{2}\.[a-zA-Z0-9_$]{2}\(a,\d+\))?/,
        /\b([a-zA-Z0-9_$]+)&&\(\1=([a-zA-Z0-9_$]{2,})\(decodeURIComponent\((\1)\)\)/,
        // Old patterns
        /\b[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*encodeURIComponent\s*\(\s*([a-zA-Z0-9$]+)\(/,
        /\b[a-zA-Z0-9]+\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*encodeURIComponent\s*\(\s*([a-zA-Z0-9$]+)\(/,
        /\bm=([a-zA-Z0-9$]{2,})\(decodeURIComponent\(h\.s\)\)/,
        // Obsolete patterns
        /("|')signature\1\s*,\s*([a-zA-Z0-9$]+)\(/,
        /\.sig\|\|([a-zA-Z0-9$]+)\(/,
        /yt\.akamaized\.net\/\)\s*\|\|\s*.*?\s*[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*(?:encodeURIComponent\s*\()?\s*([a-zA-Z0-9$]+)\(/,
        /\b[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*([a-zA-Z0-9$]+)\(/,
        /\bc\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*\([^)]*\)\s*\(\s*([a-zA-Z0-9$]+)\(/
    ];

    console.debug("finding initial function name");

    for (const pattern of functionPatterns) {
        const regex = new RegExp(pattern);
        const functionMatch = js.match(regex);
        if (functionMatch) {
            const sig = functionMatch[1]; // Group 1 is the function name
            console.debug("finished regex search, matched:", pattern);
            console.debug(`Signature cipher function name: ${sig}`);
            return sig;
        }
    }

    throw new Error(`RegexMatchError: multiple in ${jsUrl}`);
}

/*
function getThrottlingFunctionName(js, jsUrl) { 
    const functionPatterns = [
        /(?:\.get\("n"\)\)&&\(b=|(?:b=String\.fromCharCode\(110\)|([a-zA-Z0-9_$.]+))&&\(b="nn"\[\+([a-zA-Z0-9_$.]+)\]\))(?:,[a-zA-Z0-9_$]+\(a\))?,c=a\.(?:get\(b\)|[a-zA-Z0-9_$]+\[b\]\|\|null)\)&&\(c=|([a-zA-Z0-9_$]+)=([a-zA-Z0-9_$]+)(?:\[(\d+)\])?\([a-zA-Z0-9]\))/
    ];

    console.debug('Finding throttling function name');

    for (const pattern of functionPatterns) {
        try {
            const functionMatch = js.match(pattern);
            if (functionMatch) {
                console.debug('Finished regex search, matched:', pattern);

                const func = functionMatch[4];  // nfunc
                const idx = functionMatch[5];  // idx

                console.debug('func is:', func);
                console.debug('idx is:', idx);

                if (idx) {
                    // Create a dynamic regex to match the function name using the captured `func` and `idx`
                    const nFuncCheckPattern = new RegExp(`var ${func}\\s*=\\s*\\[(.+?)\\];`);
                    const nFuncFound = js.match(nFuncCheckPattern);

                    if (nFuncFound) {
                        const throttlingFunction = nFuncFound[1];
                        console.debug('Throttling function name is:', throttlingFunction);
                        return throttlingFunction;
                    } else {
                        console.error(`Unable to find function in ${jsUrl}`);
                        throw new Error(`RegexMatchError in getThrottlingFunctionName: Unable to find function in ${jsUrl}`);
                    }
                } else {
                    return func;  // Directly return if `idx` is not found
                }
            }
        } catch (error) {
            console.error(`Error matching pattern: ${pattern}`, error);
        }
    }

    throw new Error(`RegexMatchError in getThrottlingFunctionName: No match found in ${jsUrl}`);
}

*/
































async function getRemote(url) {
    const response = await fetch(url);
    return response.text();
}

const gRegex = {
    videoData: /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/,
    playlistData: /ytInitialData\s*=\s*({.+?})\s*;/,
    playerData: /set\(({.+?})\);/
};

function getStringBetween(
    string,
    needleStart,
    needleEnd,
    offsetStart = 0,
    offsetEnd = 0
) {
    const x = string.indexOf(needleStart);
    const y = needleEnd ? string.indexOf(needleEnd, x) : string.length;
    return string.substring(x + needleStart.length + offsetEnd, y + offsetStart);
}

async function getAdaptiveFormats({ videoData, playerData }) {
    const getUrlFromSignature = (signatureCipher) => {
        const searchParams = new URLSearchParams(signatureCipher);
        const [url, signature, sp] = [
            searchParams.get("url"),
            searchParams.get("s"),
            searchParams.get("sp")
        ];

        return `${url}&${sp}=${decipher(signature)}`;
    };

    const getDecipherFunction = (string) => {
        const js = string.replace("var _yt_player={}", "");
        const top = getStringBetween(js, `a=a.split("")`, "};", 1, -28);
        const beginningOfFunction =
            "var " + getStringBetween(top, `a=a.split("")`, "(", 10, 1).split(".")[0] + "=";
        const side = getStringBetween(js, beginningOfFunction, "};", 2, -beginningOfFunction.length);
        return eval(side + top);
    };

    const baseContent = await getRemote(`https://www.youtube.com${playerData.PLAYER_JS_URL}`);
    const decipher = getDecipherFunction(baseContent);

    const {
        streamingData: { adaptiveFormats }
    } = videoData;

    adaptiveFormats.forEach((format) => {
        format.url = getUrlFromSignature(format.signatureCipher);
        delete format.signatureCipher;
    });

    return adaptiveFormats;
}

async function getDownloadableLinks(formats) {
    const downloadableLinks = [];

    for (const format of formats) {
        try {
            const res = await fetch(format.url);
            if (res.ok) {
                downloadableLinks.push(format);
            }
        } catch { }
    }
    return downloadableLinks;
}

async function getVideoData(htmlYouTubePage) {
    const videoData = JSON.parse(htmlYouTubePage.match(gRegex.videoData)[1]);

    const isUnplayable = videoData.playabilityStatus.status !== "OK";
    if (isUnplayable) {
        return videoData;
    }

    const formats = videoData.streamingData.adaptiveFormats || videoData.streamingData.formats;
    const isHasStreamingUrls = Boolean(formats[0].url);
    if (isHasStreamingUrls) {
        videoData.streamingData.adaptiveFormats = await getDownloadableLinks(formats);
        return videoData;
    }

    videoData.streamingData.adaptiveFormats = await getAdaptiveFormats({
        videoData,
        playerData: JSON.parse(htmlYouTubePage.match(gRegex.playerData)[1])
    });
    return videoData;
}





































const getDecipherFunction = (string) => {
    const js = string.replace("var _yt_player={}", "");
    const top = getStringBetween(js, `k=k.split("")`, "};", 1, -28);
    const beginningOfFunction =
        "var " + getStringBetween(top, `k=k.split("")`, "(", 10, 1).split(".")[0] + "=";
    const side = getStringBetween(js, beginningOfFunction, "};", 2, -beginningOfFunction.length);
    return eval(side + top);
};






























fetch('https://www.youtube.com/s/player/f3d47b5a/player_ias.vflset/en_US/base.js').then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.text();
})
    .then(data => {

        console.log("==gvHWBDgzcJzLKWZKi9jz7MLcISdrwRHPbX7zoo9y4qJAiAUUZ5_fgBMVVpQyhx3IvFvYm0xZ6AbuhjrUyOOaO7O4IAhIQRwsSdQfJAJ");
        console.log(getDecipherFunction(data))
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });




