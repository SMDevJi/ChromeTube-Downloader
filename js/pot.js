//Source: https://github.com/LuanRT/BgUtils

/*
MIT License

Copyright (c) 2024 LuanRT

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/




function runWholePot() {

    function generateDataDiv(divId, dataInfo) {
        let existingElement = document.getElementById(divId);
        if (existingElement) {
          existingElement.remove();
        }
      
        let myDataValue = dataInfo;
        let divElement = document.createElement("div");
        divElement.id = divId;
        divElement.setAttribute("data-info", myDataValue);
        divElement.textContent = "";
        document.body.appendChild(divElement);
      }

    (async () => {
        //console.log("I am pot..")
        //dist/utis/constants.js
        const GOOG_BASE_URL = 'https://jnn-pa.googleapis.com';
        const YT_BASE_URL = 'https://www.youtube.com';
        const GOOG_API_KEY = 'AIzaSyDyT5W0Jh49F30Pqqtyfdf7pDLFKLJoAnw';
        const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36(KHTML, like Gecko)';


        //dist/utils/helpers.js
        const base64urlCharRegex = /[-_.]/g;
        const base64urlToBase64Map = {
            '-': '+',
            _: '/',
            '.': '='
        };
        class BGError extends TypeError {
            constructor(message, info) {
                super(message);
                this.name = 'BGError';
                if (info)
                    this.info = info;
            }
        }
        function base64ToU8(base64) {
            let base64Mod;
            if (base64urlCharRegex.test(base64)) {
                base64Mod = base64.replace(base64urlCharRegex, function (match) {
                    return base64urlToBase64Map[match];
                });
            }
            else {
                base64Mod = base64;
            }
            base64Mod = atob(base64Mod);
            return new Uint8Array([...base64Mod].map((char) => char.charCodeAt(0)));
        }
        function u8ToBase64(u8, base64url = false) {
            const result = btoa(String.fromCharCode(...u8));
            if (base64url) {
                return result
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_');
            }
            return result;
        }
        function isBrowser() {
            const isBrowser = typeof window !== 'undefined'
                && typeof window.document !== 'undefined'
                && typeof window.document.createElement !== 'undefined'
                && typeof window.HTMLElement !== 'undefined'
                && typeof window.navigator !== 'undefined'
                && typeof window.getComputedStyle === 'function'
                && typeof window.requestAnimationFrame === 'function'
                && typeof window.matchMedia === 'function';
            const hasValidWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')?.get?.toString().includes('[native code]') ?? false;
            return isBrowser && hasValidWindow;
        }
        function getHeaders() {
            const headers = {
                'content-type': 'application/json+protobuf',
                'x-goog-api-key': GOOG_API_KEY,
                'x-user-agent': 'grpc-web-javascript/0.1'
            };
            if (!isBrowser()) {
                headers['user-agent'] = USER_AGENT;
            }
            return headers;
        }
        function buildURL(endpointName, useYouTubeAPI) {
            return `${useYouTubeAPI ? YT_BASE_URL : GOOG_BASE_URL}/${useYouTubeAPI ? 'api/jnn/v1' : '$rpc/google.internal.waa.v1.Waa'}/${endpointName}`;
        }


        //dist/core/botGuardClient.js
        class BotGuardClient {
            constructor(options) {
                this.vmFunctions = {};
                this.userInteractionElement = options.userInteractionElement;
                this.vm = options.globalObj[options.globalName];
                this.program = options.program;
            }

            static async create(options) {
                return await new BotGuardClient(options).load();
            }
            async load() {
                if (!this.vm)
                    throw new BGError('[BotGuardClient]: VM not found in the global object');
                if (!this.vm.a)
                    throw new BGError('[BotGuardClient]: Could not load program');
                const vmFunctionsCallback = (asyncSnapshotFunction, shutdownFunction, passEventFunction, checkCameraFunction) => {
                    Object.assign(this.vmFunctions, { asyncSnapshotFunction, shutdownFunction, passEventFunction, checkCameraFunction });
                };
                try {
                    this.syncSnapshotFunction = await this.vm.a(this.program, vmFunctionsCallback, true, this.userInteractionElement, () => { }, [[], []])[0];
                }
                catch (error) {
                    throw new BGError(`[BotGuardClient]: Failed to load program (${error.message})`);
                }
                return this;
            }

            async snapshot(args) {
                return new Promise((resolve, reject) => {
                    if (!this.vmFunctions.asyncSnapshotFunction)
                        return reject(new BGError('[BotGuardClient]: Async snapshot function not found'));
                    this.vmFunctions.asyncSnapshotFunction((response) => resolve(response), [
                        args.contentBinding,
                        args.signedTimestamp,
                        args.webPoSignalOutput,
                        args.skipPrivacyBuffer
                    ]);
                });
            }

            async snapshotSynchronous(args) {
                if (!this.syncSnapshotFunction)
                    throw new BGError('[BotGuardClient]: Sync snapshot function not found');
                return this.syncSnapshotFunction([
                    args.contentBinding,
                    args.signedTimestamp,
                    args.webPoSignalOutput,
                    args.skipPrivacyBuffer
                ]);
            }

            passEvent(args) {
                if (!this.vmFunctions.passEventFunction)
                    throw new BGError('[BotGuardClient]: Pass event function not found');
                this.vmFunctions.passEventFunction(args);
            }

            checkCamera(args) {
                if (!this.vmFunctions.checkCameraFunction)
                    throw new BGError('[BotGuardClient]: Check camera function not found');
                this.vmFunctions.checkCameraFunction(args);
            }

            shutdown() {
                if (!this.vmFunctions.shutdownFunction)
                    throw new BGError('[BotGuardClient]: Shutdown function not found');
                this.vmFunctions.shutdownFunction();
            }
        }



        //dist/core/challengeFetcher.js

        async function create(bgConfig, interpreterHash) {
            const requestKey = bgConfig.requestKey;
            if (!bgConfig.fetch)
                throw new BGError('[Challenge]: Fetch function not provided');
            const payload = [requestKey];
            if (interpreterHash)
                payload.push(interpreterHash);
            const response = await bgConfig.fetch(buildURL('Create', bgConfig.useYouTubeAPI), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            if (!response.ok)
                throw new BGError('[Challenge]: Failed to fetch challenge', { status: response.status });
            const rawData = await response.json();
            return parseChallengeData(rawData);
        }

        function parseChallengeData(rawData) {
            let challengeData = [];
            if (rawData.length > 1 && typeof rawData[1] === 'string') {
                const descrambled = descramble(rawData[1]);
                challengeData = JSON.parse(descrambled || '[]');
            }
            else if (rawData.length && typeof rawData[0] === 'object') {
                challengeData = rawData[0];
            }
            const [messageId, wrappedScript, wrappedUrl, interpreterHash, program, globalName, , clientExperimentsStateBlob] = challengeData;
            const privateDoNotAccessOrElseSafeScriptWrappedValue = Array.isArray(wrappedScript) ? wrappedScript.find((value) => value && typeof value === 'string') : null;
            const privateDoNotAccessOrElseTrustedResourceUrlWrappedValue = Array.isArray(wrappedUrl) ? wrappedUrl.find((value) => value && typeof value === 'string') : null;
            return {
                messageId,
                interpreterJavascript: {
                    privateDoNotAccessOrElseSafeScriptWrappedValue,
                    privateDoNotAccessOrElseTrustedResourceUrlWrappedValue
                },
                interpreterHash,
                program,
                globalName,
                clientExperimentsStateBlob
            };
        }

        function descramble(scrambledChallenge) {
            const buffer = base64ToU8(scrambledChallenge);
            if (buffer.length)
                return new TextDecoder().decode(buffer.map((b) => b + 97));
        }




        //dist/core/webPoMinter.js
        class WebPoMinter {
            constructor(mintCallback) {
                this.mintCallback = mintCallback;
            }
            static async create(integrityTokenResponse, webPoSignalOutput) {
                const getMinter = webPoSignalOutput[0];
                if (!getMinter)
                    throw new BGError('PMD:Undefined');
                if (!integrityTokenResponse.integrityToken)
                    throw new BGError('Failed to create WebPoMinter: No integrity token provided', integrityTokenResponse);
                const mintCallback = await getMinter(base64ToU8(integrityTokenResponse.integrityToken));
                if (!(mintCallback instanceof Function))
                    throw new BGError('APF:Failed');
                return new WebPoMinter(mintCallback);
            }
            async mintAsWebsafeString(identifier) {
                const result = await this.mint(identifier);
                return u8ToBase64(result, true);
            }
            async mint(identifier) {
                const result = await this.mintCallback(new TextEncoder().encode(identifier));
                if (!result)
                    throw new BGError('YNJ:Undefined');
                if (!(result instanceof Uint8Array))
                    throw new BGError('ODM:Invalid');
                return result;
            }
        }



        //dist/core/webPoClient.js

        async function generate(args) {
            const { program, bgConfig, globalName } = args;
            const { identifier } = bgConfig;
            const botguard = await BotGuardClient.create({ program, globalName, globalObj: bgConfig.globalObj });
            const webPoSignalOutput = [];
            const botguardResponse = await botguard.snapshot({ webPoSignalOutput });
            const payload = [bgConfig.requestKey, botguardResponse];
            const integrityTokenResponse = await bgConfig.fetch(buildURL('GenerateIT', bgConfig.useYouTubeAPI), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const integrityTokenJson = await integrityTokenResponse.json();
            const [integrityToken, estimatedTtlSecs, mintRefreshThreshold, websafeFallbackToken] = integrityTokenJson;
            const integrityTokenData = {
                integrityToken,
                estimatedTtlSecs,
                mintRefreshThreshold,
                websafeFallbackToken
            };
            const webPoMinter = await WebPoMinter.create(integrityTokenData, webPoSignalOutput);
            const poToken = await webPoMinter.mintAsWebsafeString(identifier);
            return { poToken, integrityTokenData };
        }

        function generateColdStartToken(identifier, clientState) {
            const encodedIdentifier = new TextEncoder().encode(identifier);
            if (encodedIdentifier.length > 118)
                throw new BGError('DFO:Invalid', { identifier });
            const timestamp = Math.floor(Date.now() / 1000);
            const randomKeys = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];

            const header = randomKeys.concat([
                0, (clientState ?? 1)
            ], [
                (timestamp >> 24) & 0xFF,
                (timestamp >> 16) & 0xFF,
                (timestamp >> 8) & 0xFF,
                timestamp & 0xFF
            ]);
            const packet = new Uint8Array(2 + header.length + encodedIdentifier.length);
            packet[0] = 34;
            packet[1] = header.length + encodedIdentifier.length;
            packet.set(header, 2);
            packet.set(encodedIdentifier, 2 + header.length);
            const payload = packet.subarray(2);
            const keyLength = randomKeys.length;
            for (let i = keyLength; i < payload.length; i++) {
                payload[i] ^= payload[i % keyLength];
            }
            return u8ToBase64(packet, true);
        }

        function generatePlaceholder(identifier, clientState) {
            return generateColdStartToken(identifier, clientState);
        }

        function decodeColdStartToken(token) {
            const packet = base64ToU8(token);
            const payloadLength = packet[1];
            const totalPacketLength = 2 + payloadLength;
            if (packet.length !== totalPacketLength)
                throw new BGError('Invalid packet length.', { packetLength: packet.length, expectedLength: totalPacketLength });
            const payload = packet.subarray(2);
            // Decrypt the payload by reversing the XOR operation
            const keyLength = 2;
            for (let i = keyLength; i < payload.length; ++i) {
                payload[i] ^= payload[i % keyLength];
            }
            const keys = [payload[0], payload[1]];
            const unknownVal = payload[2]; // The masked property I mentioned in the function above
            const clientState = payload[3];
            const timestamp = (payload[4] << 24) |
                (payload[5] << 16) |
                (payload[6] << 8) |
                payload[7];
            const date = new Date(timestamp * 1000);
            const identifier = new TextDecoder().decode(payload.subarray(8));
            return {
                identifier,
                timestamp,
                unknownVal,
                clientState,
                keys,
                date
            };
        }



























        const requestKey = 'O43z0dpjhgX20SCx4KAo';
        const visitorData = document.getElementById("hidden-vd").getAttribute("data-info");

        if (!visitorData)
            throw new Error('Could not get visitor data');


        /*
        Object.assign(globalThis, {
          window: window,
          document: window.document
        });
        */
        const bgConfig = {
            fetch: (input, init) => fetch(input, init),
            globalObj: globalThis,
            identifier: visitorData,
            requestKey
        };

        const bgChallenge = await create(bgConfig);

        if (!bgChallenge)
            throw new Error('Could not get challenge');

        const interpreterJavascript = bgChallenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;

        if (interpreterJavascript) {
            new Function(interpreterJavascript)();
        } else throw new Error('Could not load VM');

        const poTokenResult = await generate({
            program: bgChallenge.program,
            globalName: bgChallenge.globalName,
            bgConfig
        });

        /*
        console.log({
            visitorData: visitorData,
            poToken: poTokenResult.poToken
        });
        */
        generateDataDiv("hidden-pot-value",poTokenResult.poToken)


    })();
}


setInterval(() => {
    //console.log("Searching pot..")
    try{
        if (document.getElementById("hidden-pot-toggle").getAttribute("data-info")=="1") {
            runWholePot()
            //console.log("Calculating pot... ");
        }
    }catch{

    }
}, 3000);