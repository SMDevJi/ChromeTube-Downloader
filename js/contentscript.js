console.log("I am content script!");


/*
fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Youtube-Client-Name': '28'
  },
  body: JSON.stringify({
    'context': {
      'client': {
        'clientName': 'ANDROID_VR',
        'clientVersion': '1.60.19',
        'deviceMake': 'Oculus',
        'deviceModel': 'Quest 3',
        'osName': 'Android',
        'osVersion': '12L',
        'androidSdkVersion': '32'
      }
    },
    'videoId': 'Wg92RrNhB8s',
    'contentCheckOk': 'true'
  })
}).then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
})
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });

*/


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getYouTubeVideoId(url) {
  const regex = /(?:https?:\/\/(?:www\.)?(?:youtube\.com\/(?:v|e(?:mbed)?)\/|(?:[^\/\n\s]+\/\S+\/|.*?[?&]v=)|(?:shorts\/)))([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function getBaseJsSrc() {
  // Get all script tags on the page
  const scripts = document.querySelectorAll('script');

  // Loop through each script tag and check if the src includes 'base.js'
  for (let script of scripts) {
    if (script.src.includes('base.js')) {
      return script.src; // Return the src if it includes 'base.js'
    }
  }

  return null; // Return null if no matching script is found
}

function extractYtInitialPlayerResponse(html) {
  const regex = /var\s+ytInitialPlayerResponse\s*=\s*(\{.*?\});/s;
  const match = html.match(regex);

  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return null;
    }
  }

  return null;
}

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

function deleteDataDiv(divId) {
  let existingElement = document.getElementById(divId);
  if (existingElement) {
    existingElement.remove();
  }
}

function extractVisitorData(html) {
  // Regular expression to find visitorData value within quotes
  const regex = /"visitorData":"(.*?)"/;
  const match = html.match(regex);

  // If match is found, return the extracted value; otherwise, return null
  if (match && match[1]) {
      return match[1];
  } else {
      return null; // Return null if no visitorData is found
  }
}









// Declare global variables for the elements
let alertPopup, alertContent, alertHeader, alertMessage, closeBtn;

// Wait for the DOM to load before creating the alert elements
document.addEventListener('DOMContentLoaded', () => {
  // Create the alert popup (only once), initially hidden
  alertPopup = document.createElement('div');
  alertPopup.id = 'alertPopup';  // Assign an ID for global access
  alertPopup.style.display = 'none'; // The alert stays hidden at first
  alertPopup.style.position = 'fixed';
  alertPopup.style.top = '0';
  alertPopup.style.left = '0';
  alertPopup.style.width = '100%';
  alertPopup.style.height = '100%';
  alertPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  alertPopup.style.justifyContent = 'center';
  alertPopup.style.alignItems = 'center';
  alertPopup.style.zIndex = '9999';
  //alertPopup.style.display = 'flex';

  // Create the alert content box
  alertContent = document.createElement('div');
  alertContent.style.backgroundColor = '#fff';
  alertContent.style.padding = '20px';
  alertContent.style.borderRadius = '8px';
  alertContent.style.width = '300px';
  alertContent.style.textAlign = 'center';
  alertContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';

  // Create the alert header (default)
  alertHeader = document.createElement('h2');
  alertHeader.textContent = 'Alert!';
  alertHeader.style.margin = '0';
  alertHeader.style.color = '#333';
  alertHeader.style.fontSize = '30px'; // Increase font size for the heading

  // Create the alert message (default)
  alertMessage = document.createElement('p');
  alertMessage.textContent = 'This is an alert message.';
  alertMessage.style.color = '#555';
  alertMessage.style.fontSize = '20px'; // Increase font size for the message

  // Create the close button
  closeBtn = document.createElement('span');
  closeBtn.textContent = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '10px';
  closeBtn.style.right = '10px';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#333';

  closeBtn.addEventListener('mouseover', () => {
    closeBtn.style.color = 'red';
  });

  closeBtn.addEventListener('mouseout', () => {
    closeBtn.style.color = '#333';
  });

  closeBtn.addEventListener('click', hideAlert);

  // Append elements to the alert content
  alertContent.appendChild(closeBtn);
  alertContent.appendChild(alertHeader);
  alertContent.appendChild(alertMessage);
  alertPopup.appendChild(alertContent);

  // Append the popup to the body
  document.body.appendChild(alertPopup);
});

// Function to show the alert popup with custom content
function showAlert(headingText, messageText) {
  if (!alertPopup) return;  // Ensure the alert elements are available
  alertHeader.textContent = headingText || 'Alert!';
  alertMessage.textContent = messageText || 'This is an alert message.';
  alertPopup.style.display = 'flex';  // Show the alert popup
}

// Function to hide the alert popup
function hideAlert() {
  if (!alertPopup) return;  // Ensure the alert elements are available
  alertPopup.style.display = 'none';  // Hide the alert popup
}







/*
async function appendHiddenElementWithVariable(variableName) {
  // First, remove the existing element with the id 'secret' if it exists
  const existingSecretElement = document.getElementById('videoInfoContainer');
  if (existingSecretElement) {
    existingSecretElement.remove();
  }


  chrome.runtime.sendMessage({ type: 'injectScript',args:variableName}, (response) => {
    
    console.log('Current tab ID:', response);
  });

 
}
*/












chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  //showAlert("test", "test")
  (async () => {
    if (request.action === "fetchData") {
      videoId = getYouTubeVideoId(window.location.href)
      if (videoId == null) {
        sendResponse({ data: { error: "VIDEO_NOT_PLAYING" } });
      } else {
        maxRetry = 4;
        for (let i = 0; i < maxRetry; i++) {
          //console.log(`${i + 1}th Try..`)
          response = await fetch(`https://${window.location.hostname}/youtubei/v1/player?prettyPrint=false`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Youtube-Client-Name': '28'
            },
            body: JSON.stringify({
              'context': {
                'client': {
                  'clientName': 'ANDROID_VR',
                  'clientVersion': '1.60.19',
                  'deviceMake': 'Oculus',
                  'deviceModel': 'Quest 3',
                  'osName': 'Android',
                  'osVersion': '12L',
                  'androidSdkVersion': '32',
                  'visitorData': extractVisitorData(document.body.innerHTML),
                }
              },
              'videoId': videoId,
              'contentCheckOk': 'true'
            })
          })
          data = await response.json()
          //console.log(data)
          if ('streamingData' in data) {
            break;
          }
        }



        //console.log(data)
        if ('streamingData' in data) {
          sendResponse({ data: data });
        } else {
          sendResponse({ data: { error: "EXTRACT_FAILED" } });
        }
      }


    }
    else if (request.action === "fetchBaseJsURL") {
      sendResponse({ data: getYouTubeVideoId(window.location.href) })

    } else if (request.action === "fetchPlayerData") {
      //await appendHiddenElementWithVariable("ytInitialPlayerResponse")
      //await sleep(2000)
      //videoInfo = document.getElementById('videoInfoContainer').getAttribute("data-variable")
      //videoInfo=requestPageVariable("ytplayer.config.args.raw_player_response");



      //console.log(videoInfo)
      sendResponse({ data: getYouTubeVideoId(window.location.href) })


    } else if (request.action === "injectPotExtractor") {

      generateDataDiv("hidden-vd", request.data)
      generateDataDiv("hidden-pot-toggle", "1")
      deleteDataDiv("hidden-pot-value")
      /*
      chrome.runtime.sendMessage({ type: 'injectBg' }, (response) => {
        console.log('Response from Background:', response);
      });
      */

      const checkInterval = setInterval(() => {
        //console.log("Searching pot..")
        if (document.getElementById("hidden-pot-value")) {
          poToken = document.getElementById("hidden-pot-value").getAttribute("data-info")
          //console.log("poToken found: ", poToken);
          sendResponse({ data: poToken });
          generateDataDiv("hidden-pot-toggle", "0");
          //console.log(checkInterval);
          clearInterval(checkInterval);

        }
      }, 1500);


      /*
      // URL from which we will fetch HTML content
      const url = 'http://localhost:9999/index.html'; // Replace with your desired URL
 
      // Use the Fetch API to get the HTML content
      fetch(url)
        .then(response => {
          if (response.ok) {
            return response.text(); // Extract the response as text (HTML)
          } else {
            throw new Error('Failed to fetch the content');
          }
        })
        .then(htmlContent => {
          // Write the fetched HTML content to the document
          document.write(htmlContent);
        })
        .catch(error => {
          console.error('Error:', error);
        });
 
        */
      /*
      // Create an iframe element
      var iframe = document.createElement('iframe');
 
      // Set the source of the iframe to the desired URL
      iframe.src = chrome.runtime.getURL("/junk/index.html");
      iframe.id="pote"
 
      // Optionally, set other properties like width, height, and styles
      iframe.width = "600";  // Set width to 600px
      iframe.height = "400"; // Set height to 400px
      iframe.style.border = "1px solid #ccc"; // Optional border style
 
      // Append the iframe to the body or another element in your HTML
      document.body.appendChild(iframe);
      */

      /*
      {
        const url = chrome.runtime.getURL('/html/pot.html');
 
        var iframe = document.createElement('iframe');
 
        // Set attributes for the iframe
        iframe.src='about:blank'
        iframe.width = '600'; // Width of the iframe
        iframe.height = '400'; // Height of the iframe
 
        document.body.appendChild(iframe)
 
        fetch(url)
          .then(response => {
            if (response.ok) {
              return response.text();
            } else {
              throw new Error('Failed to fetch the content');
            }
          })
          .then(htmlContent => {
            var iframeDocument = iframe.contentWindow.document;
 
            // You can change the content inside the iframe using its document
            iframeDocument.open(); // Open the document for writing
            iframeDocument.write(htmlContent);
            iframeDocument.close();
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
          */
    } else if (request.action === "showProgress") {
      //console.log("sp called")

      showAlert('Started Link Conversion', `Converting Link ${request.data[0]} of ${request.data[1]} [${((request.data[0] / request.data[1]) * 100).toFixed(2)}%]`)
      if (request.data[0] == request.data[1]) {
        hideAlert()
      }
      sendResponse({ data: "Done.." })
    }
  })();

  return true;
});





