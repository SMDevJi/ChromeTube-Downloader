const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({
    corePath: chrome.runtime.getURL("ffmpeg/ffmpeg-core.js"),
    log: true,
    mainName: 'main',
    progress: ({ ratio, time, duration }) => {
        per = ratio * 100
        console.log(per)
        document.querySelector('.m-progress').style.display = 'flex';
        document.getElementById('merge-file').setAttribute('value', per)
        document.getElementById('m-progress-percent').innerText = `Merging Files.. ${Math.round(per * 100) / 100} %`
    },
});

async function getFileExtFromUrl(url) {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('Content-Type');

    const extension = contentType.split('/')[1];
    return extension
}


document.addEventListener("DOMContentLoaded", async () => {
    let url = new URL(window.location.href);
    let searchParams = new URLSearchParams(url.search);

    if (searchParams.get('isMP3') == 0) {
        async function downloadFileInPartsWithProgress(url, fileName, numParts = 4, ftype) {
            // Get the file size first to calculate range
            const response = await fetch(url, { method: 'HEAD' });
            const contentLength = parseInt(response.headers.get('Content-Length'), 10);

            if (!contentLength) {
                console.error('Could not fetch the file size.');
                return;
            }

            const partSize = Math.floor(contentLength / numParts);
            const rangeRequests = [];
            let totalDownloaded = 0;

            // Progress reporting function
            const reportProgress = (partIndex, bytesDownloaded, partTotal) => {
                const percentage = (bytesDownloaded / partTotal) * 100;
                //console.log(`Part ${partIndex + 1}: ${Math.round(percentage)}%`);
                totalDownloaded += bytesDownloaded;
                const totalPercentage = (totalDownloaded / contentLength) * 100;
                //console.log(`Overall Progress: ${Math.round(totalPercentage)}%`);
                //console.log(ftype)
                if (ftype == 'video') {
                    document.getElementById('video-file').value = Math.round(totalPercentage)
                    document.getElementById('v-progress-percent').innerHTML = `Video Download Progress: ${Math.round(totalPercentage)}%`
                } else {
                    document.getElementById('audio-file').value = Math.round(totalPercentage)
                    document.getElementById('a-progress-percent').innerHTML = `Audio Download Progress: ${Math.round(totalPercentage)}%`

                    if (Math.round(totalPercentage) == 100) {
                        document.querySelector('.m-progress').style.display = 'flex';
                        document.getElementById('merge-file').setAttribute('value', 0)
                        document.getElementById('m-progress-percent').innerHTML = `Started Merging Files<br>Please Wait a few seconds.. `
                    }
                }
            };

            // Create download requests for each part
            for (let i = 0; i < numParts; i++) {
                const start = i * partSize;
                const end = (i === numParts - 1) ? contentLength - 1 : (start + partSize - 1);

                // Fetch the part with Range header
                const partRequest = fetch(url, {
                    method: 'GET',
                    headers: {
                        'Range': `bytes=${start}-${end}`
                    }
                }).then(async (response) => {
                    const reader = response.body.getReader();
                    let partDownloaded = 0;
                    const chunks = [];
                    const totalPartSize = end - start + 1;

                    // Read the stream in chunks and track progress
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        // Push chunk to array
                        chunks.push(value);
                        partDownloaded += value.length;

                        // Report progress for this part
                        reportProgress(i, value.length, totalPartSize);
                    }

                    // Concatenate all chunks into a single Blob
                    return new Blob(chunks, { type: 'application/octet-stream' });
                });

                rangeRequests.push(partRequest);
            }

            // Wait for all parts to be downloaded
            const parts = await Promise.all(rangeRequests);


            // Combine the parts into a single Blob
            const fileBlob = new Blob(parts, { type: 'application/octet-stream' });


            downloadedObjURL = URL.createObjectURL(fileBlob);
            await ffmpeg.FS('writeFile', fileName, await fetchFile(fileBlob));
            console.log(fileName)



            // Cleanup the URL object
            URL.revokeObjectURL(downloadedObjURL);
        }



        let url = new URL(window.location.href);
        let searchParams = new URLSearchParams(url.search);
        vaurls = {
            vurl: atob(searchParams.get('vurl')),
            aurl: atob(searchParams.get('aurl')),
            fname: atob(searchParams.get('fname')),
            qtxt: searchParams.get('qtxt'),
            thumb: atob(searchParams.get('thumb'))
        }
        console.log(vaurls)

        var dHeading = `[${vaurls.qtxt}] ${vaurls.fname}`.length > 70 ? `[${vaurls.qtxt}] ${vaurls.fname}`.substring(0, 68) + '...' : `[${vaurls.qtxt}] ${vaurls.fname}`;
        document.querySelector('#merge-heading').innerHTML = dHeading;

        document.getElementById('thumb').style.display = 'block';
        document.getElementById('thumb').setAttribute('src', vaurls.thumb)
        await ffmpeg.load()

        videoExt = await getFileExtFromUrl(vaurls.vurl)
        audioExt = await getFileExtFromUrl(vaurls.aurl)



        document.getElementById('progress').style.display = 'flex';
        await downloadFileInPartsWithProgress(vaurls.vurl, `inputVideo.${videoExt}`, 5, ftype = 'video');
        await downloadFileInPartsWithProgress(vaurls.aurl, `inputAudio.${audioExt}`, 5, ftype = 'audio');





        await ffmpeg.run('-i', `inputVideo.${videoExt}`, '-i', `inputAudio.${audioExt}`, '-c:v', 'copy', '-c:a', 'aac', 'output.mp4');

        document.getElementById('thumb').style.display = 'none';
        document.querySelector('#video-player').style.display = 'block'

        const data = ffmpeg.FS('readFile', 'output.mp4');
        const video = document.querySelector('#video-player');
        video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

        document.getElementById("merged-save-btn").style.display = 'block';
        document.getElementById("merged-save-btn").addEventListener("click", function (e) {
            const videoElement = document.getElementById("video-player");
            const videoSrc = videoElement.src;

            const link = document.createElement("a");
            link.href = videoSrc;
            link.download = dHeading + '.mp4';

            link.click();
        });
    }
    else {
        async function downloadFileInPartsWithProgress(url, fileName, numParts = 4, ftype) {
            const response = await fetch(url, { method: 'HEAD' });
            const contentLength = parseInt(response.headers.get('Content-Length'), 10);

            if (!contentLength) {
                console.error('Could not fetch the file size.');
                return;
            }

            const partSize = Math.floor(contentLength / numParts);
            const rangeRequests = [];
            let totalDownloaded = 0;

            const reportProgress = (partIndex, bytesDownloaded, partTotal) => {
                const percentage = (bytesDownloaded / partTotal) * 100;
                totalDownloaded += bytesDownloaded;
                const totalPercentage = (totalDownloaded / contentLength) * 100;

                document.getElementById('mp3-audio-file').value = Math.round(totalPercentage)
                document.getElementById('mp3-progress-percent').innerHTML = `Downloading File: ${Math.round(totalPercentage)}%`

                if(Math.round(totalPercentage)==100){
                    document.getElementById('mp3-progress-percent').innerHTML = `Downloading Complete<br>Please wait for convertion..`
                }



            };


            for (let i = 0; i < numParts; i++) {
                const start = i * partSize;
                const end = (i === numParts - 1) ? contentLength - 1 : (start + partSize - 1);

                const partRequest = fetch(url, {
                    method: 'GET',
                    headers: {
                        'Range': `bytes=${start}-${end}`
                    }
                }).then(async (response) => {
                    const reader = response.body.getReader();
                    let partDownloaded = 0;
                    const chunks = [];
                    const totalPartSize = end - start + 1;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        chunks.push(value);
                        partDownloaded += value.length;

                        reportProgress(i, value.length, totalPartSize);
                    }

                    return new Blob(chunks, { type: 'application/octet-stream' });
                });

                rangeRequests.push(partRequest);
            }

            const parts = await Promise.all(rangeRequests);

            const fileBlob = new Blob(parts, { type: 'application/octet-stream' });


            downloadedObjURL = URL.createObjectURL(fileBlob);
            await ffmpeg.FS('writeFile', fileName, await fetchFile(fileBlob));
            console.log(fileName)


            URL.revokeObjectURL(downloadedObjURL);
        }



        let url = new URL(window.location.href);
        let searchParams = new URLSearchParams(url.search);
        vaurls = {
            aurl: atob(searchParams.get('aurl')),
            fname: atob(searchParams.get('fname')),
            qtxt: searchParams.get('qtxt'),
            thumb: atob(searchParams.get('thumb'))
        }
        console.log(vaurls)

        var dHeading = `[${vaurls.qtxt}] ${vaurls.fname}`.length > 70 ? `[${vaurls.qtxt}] ${vaurls.fname}`.substring(0, 68) + '...' : `[${vaurls.qtxt}] ${vaurls.fname}`;
        document.querySelector('#merge-heading').innerHTML = dHeading;

        document.getElementById('thumb').style.display = 'block';
        document.getElementById('thumb').setAttribute('src', vaurls.thumb)
        await ffmpeg.load()


        audioExt = await getFileExtFromUrl(vaurls.aurl)



        document.getElementById('mp3-progress').style.display = 'flex';
        await downloadFileInPartsWithProgress(vaurls.aurl, `inputAudio.${audioExt}`, 5, ftype = 'audio');


        await ffmpeg.run('-i', `inputAudio.${audioExt}`, 'output.mp3');


        document.getElementById('mp3-m-progress-percent').innerText = `Convertion Complete!  `

        document.querySelector('#audio-player').style.display = 'block'

        const data = ffmpeg.FS('readFile', 'output.mp3');
        const audio = document.querySelector('#audio-player');
        audio.src = URL.createObjectURL(new Blob([data.buffer], { type: 'audio/mp3' }));

        document.getElementById("mp3-save-btn").style.display = 'block';
        document.getElementById("mp3-save-btn").addEventListener("click", function (e) {
            const audioElement = document.getElementById("audio-player");
            const audioSrc = audioElement.src;

            const link = document.createElement("a");
            link.href = audioSrc;
            link.download = dHeading + '.mp3';

            link.click();
        });
    }

});