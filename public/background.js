let tabStartTimes = {};
let tabEndTimes = {};
let tabUrls = {};
let currentUserId = null;
let blockedSites = [];
let limits = { daily: 0, weekly: 0 };
let usage = { today: 0, week: 0 };

let lastReset = null;

function getUserData(userId) {
  if (userId) {
    fetch(`http://localhost:4000/api/getChildLimits/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        const today = new Date().toISOString().split("T")[0];
        limits.daily = data.dailyLimit;
        limits.weekly = data.weeklyLimit;
        usage.today = data.usage.today;
        usage.week = data.usage.week;
        blockedSites = data.blockedSites.map((site) => site.url);
        lastReset = data.lastReset;
        if (data.lastReset !== today) {
          updateUserData(userId, today);
          usage.today = 0;
          data.lastReset = today;
        }
      })
      .catch((error) => console.error("Error fetching blocked sites:", error));
  }
}

function updateUserData(userId, resetDate) {
  if (userId) {
    fetch("http://localhost:4000/api/update-last-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        resetDate,
      }),
    })
      .then((response) => response.json())
      .then((data) => console.log("Last reset date updated:", data))
      .catch((error) =>
        console.error("Error updating last reset date:", error)
      );
  }
}
function updateUsageData(increment) {
  if (currentUserId) {
    fetch("http://localhost:4000/api/update-usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: currentUserId,
        increment,
      }),
    })
      .then((response) => response.json())
      .catch((error) => {
        console.error("Error updating usage in DB:", error);
      });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REMOVE_USER_ID" && message.userId) {
    currentUserId = null;
    limits.daily = 0;
    limits.weekly = 0;
    usage.today = 0;
    usage.week = 0;
    blockedSites = null
    sendResponse({ success: true });

    // chrome.storage.local.remove("currentUserId", () => {
    //   console.log("User ID removed from storage.");
    //   sendResponse({ success: true });
    // });
    // return true;
  }
  if (message.type === "SET_USER_ID" && message.userId) {
    currentUserId = message.userId;
    // chrome.storage.local.set({ currentUserId: currentUserId }, () => {
    //   console.log("User ID saved in storage.");
    // });
    getUserData(currentUserId);
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false });
  }
});

// chrome.runtime.onStartup.addListener(() => {
//   chrome.storage.local.get("currentUserId", (result) => {
//     if (result.currentUserId) {
//       currentUserId = result.currentUserId;
//       console.log("User ID restored from storage:", currentUserId);

//       getUserData(currentUserId);
//     } else {
//       console.log("No user ID found in storage.");
//     }
//   });
// });

setInterval(() => {
  const counter = 10 / 60;
  usage.today += counter;
  usage.week += counter;
  console.log(" usage.today: ", usage.today);
  console.log("limits.daily: ", limits.daily);

  if (limits.daily != 0 && limits.weekly != 0) {
    if (usage.today > limits.daily || usage.week > limits.weekly) {
      updateUsageData(counter);
      chrome.tabs.create({ url: "about:blank" }, (newTab) => {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (
              tab.id !== newTab.id &&
              !tab.url.startsWith("chrome-extension://")
            ) {
              sendNotification(false)
              chrome.tabs.remove(tab.id);
            }
          });
        });
      });
    }
  }
}, 10000);

chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  const currentTime = Date.now();

  if (!tabStartTimes[tabId]) {
    tabStartTimes[tabId] = currentTime;
    chrome.tabs.get(tabId, (tab) => {
      if (checkBlockedSite(tab.url)) {
        chrome.tabs.remove(tabId);
      } else {
        console.log(tabUrls);
        if (tab && tab.url && !isInternalTab(tab.url)) {
          tabUrls[tabId] = tab.url;
        }
      }
    });
  }
  getUserData();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const currentTime = Date.now();
  if (tabStartTimes[tabId]) {
    tabEndTimes[tabId] = currentTime;
    const timeSpent = (tabEndTimes[tabId] - tabStartTimes[tabId]) / 1000;
    const url = tabUrls[tabId];
    console.log(url, tabUrls);
    if (url) {
      saveActivity(url, timeSpent, currentUserId);
    }
    delete tabStartTimes[tabId];
    delete tabEndTimes[tabId];
    delete tabUrls[tabId];
  }
});

function saveActivity(url, timeSpent, currentUserId) {
  if (currentUserId) {
    fetch("http://localhost:4000/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: currentUserId,
        url: url,
        timeSpent: timeSpent,
      }),
    })
      .then((response) => response.json())
      .catch((error) => console.error("Error logging activity:", error));
  } else {
    console.error("No user ID available to log activity.");
  }
}

function checkBlockedSite(url) {
  const domain = new URL(url).hostname;
  const normalURL = url.toLowerCase(); 
  const normalizedSites = blockedSites.map(site => site.toLowerCase()); 
  
  if (normalizedSites.includes(normalURL)) {
    sendNotification(url);
    return true;
  }

  for (let site of normalizedSites) {
    if (normalURL.includes(site) || domain.includes(site.replace(/^www\./, ''))) {
      sendNotification(url);
      return true;
    }
  }

  return false;
}
function sendNotification(blockedUrl) {
  if(blockedUrl) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "logo192.png", 
      title: "Site Blocked",
      message: `Access to ${blockedUrl} has been blocked.`,
    }, (notificationId) => {
      console.log("Notification sent with ID:", notificationId);
    });
  } else {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "logo192.png", 
      title: "Site Blocked",
      message: 'Ypur time limit is expire',
    }, (notificationId) => {
      console.log("Notification sent with ID:", notificationId);
    });
  }
}
function isInternalTab(url) {
  const excludedPrefixes = [
    "chrome-extension://",
    "chrome://",
    "about:",
    "file://",
    "data:",
    "view-source:",
  ];
  return excludedPrefixes.some((prefix) => url.startsWith(prefix));
}

chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("index.html"),
    type: "popup",
    width: 1200,
    height: 800,
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log(tabUrls);
    if (
      changeInfo.status === "complete" &&
      tab.url &&
      !isInternalTab(tab.url)
    ) {
      if (checkBlockedSite(tab.url)) {
        chrome.tabs.remove(tabId);
      } else {
        tabUrls[tabId] = tab.url;
      }
    }
  }
});
