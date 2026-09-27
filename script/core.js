// DarkTube content script
//
// Inverts the colors of the YouTube video player and keeps the effect
// applied correctly as the user navigates between videos, since
// YouTube is a single-page app that swaps the <video> element
// in and out without a full page reload.

const FILTER_VALUE = "invert(1) hue-rotate(180deg)";
let isEnabled = true; // overwritten by the stored preference on load

function applyFilter() {
    const video = document.querySelector("video");
    if (!video) return; // video not in the DOM yet -- nothing to do
    video.style.filter = isEnabled ? FILTER_VALUE : "";
}

function loadStateAndApply() {
    chrome.storage.sync.get({ darkTubeEnabled: true }, (result) => {
        isEnabled = result.darkTubeEnabled;
        applyFilter();
    });
}

// Re-apply whenever DOM changes might have introduced or replaced the
// <video> element. This is what makes the extension survive clicking
// to a new video without a full page reload.
const observer = new MutationObserver(() => {
    applyFilter();
});
observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
});

// YouTube also fires this custom event once client-side navigation
// to a new video finishes -- a good extra hook to re-apply on.
document.addEventListener("yt-navigate-finish", applyFilter);

// Listen for on/off toggle messages sent from the popup, so the user
// doesn't need to reload the page for a change to take effect.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "DARKTUBE_TOGGLE") {
        isEnabled = message.enabled;
        applyFilter();
        sendResponse({ status: "ok", enabled: isEnabled });
    }
});

loadStateAndApply();
