console.log("I am background script!");
chrome.userScripts.configureWorld({
  csp: "script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none';"
});

const scripts = chrome.userScripts.getScripts();
if (scripts.length > 0) {
  chrome.userScripts.unregister();
  console.log("Existing scripts removed.");
}

chrome.userScripts.register([
  {
    id: "potScript",
    matches: [
      "https://youtube.com/*",
      "https://*.youtube.com/*",
      "https://youtu.be/*",
      "http://youtube.com/*",
      "http://*.youtube.com/*",
      "http://youtu.be/*"
    ],
    js: [{ file: "/js/pot.js" }],
  },
]);




/*

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "injectBg") {
    try {

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        // tabs is an array of tab objects
        const activeTab = tabs[0];
        console.log(activeTab)
        
        console.log('Active Tab URL:', activeTab.url);
      });

      // Register new script
      

      console.log("New script registered.");
      sendResponse({ status: "Registered successfully" });
    } catch (error) {
      console.error("Error registering script:", error);
      sendResponse({ status: "Error", message: error.message });
    }


    return true; // Keeps message channel open for async response
  }
});


*/



/*

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'injectScript') {
    const tabId = sender.tab.id;

    console.log(message)

    // Define the function that will be executed in the context of the page
    var scriptContent = function (variableName) {
      console.log("inject successful..")
      
      const variable = window[variableName];  // Access the variable by name from the window object
      console.log(variable)
      if (variable !== undefined) {
        const secretElement = document.createElement('div');  // Create the hidden element
        secretElement.id = 'videoInfoContainer';  // Set the ID to "secret"
        secretElement.style.display = 'none';  // Hide the element
        secretElement.setAttribute('data-variable', JSON.stringify(variable));  // Set the variable as an attribute
        document.body.appendChild(secretElement);  // Append the element to the body
      }
    };
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: scriptContent,
      args: [message.args],
      world:"MAIN"
    });
    sendResponse({ tabId: tabId });
  }
  return true;
});

*/



/*
//-----------------------------------------------------------------------//

// chrome.tabs.onCreated.addListener(function(tab) {
//     console.log(tab)
// })

//-----------------------------------------------------------------------//
// chrome.tabs.onActivated.addListener(function(tab) {
//     console.log(tab)
// })
//-----------------------------------------------------------------------//

// listen to bookmark creation
chrome.bookmarks.onCreated.addListener(function (id, bookmark) {
  console.log(id)
  console.log(bookmark)
});
//-----------------------------------------------------------------------//

//Context menu

chrome.contextMenus.create({
  id: "sampleContextMenu",
  title: "Sample Context Menu uuu",
  contexts: ["all"]
});
chrome.contextMenus.create({
  id: "sampleContextMenu2",
  title: "Sample Context Menu 673e3672",
  contexts: ["all"]
});
chrome.contextMenus.create({
  id: "sampleContextMenu3",
  title: "Sample Context Menu hfiuehuiqegbqe",
  contexts: ["all"]
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  console.log(info);
  console.log(tab);
});


//-----------------------------------------------------------------------//

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(request);
});
*/