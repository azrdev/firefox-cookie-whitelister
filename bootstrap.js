const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

function isNativeUI() {
  let appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
  return (appInfo.ID == "{aa3c5121-dab2-40e2-81ca-7ea25febc110}");
}

function showToast(aWindow, message) {
  aWindow.NativeWindow.toast.show(message, "short");
}

function getSiteURI(window) {
  var host = window.BrowserApp.selectedTab.window.location.host;
  host = host.replace(/^\s*([-\w]*:\/+)?/, "");
  try {
    return Services.io.newURI("http://" + host, null, null);
  }
  catch(e) {
    return null;
  }
}

// Doorhanger UI objects
const doorhangerID = "cwa-doorhanger";
var button_allow, button_delete, button_session, buttons;

function showDoorhanger(window) {
  var siteURI = getSiteURI(window);
  if(siteURI == null) {
    showToast(window, "Failed to get site URI.");
    return false;
  }

  // initialization has to be done here, since the callbacks need 'window'
  button_allow = {
    label: "Permanently",
    callback: function() {
      dump("Add permanently to cookie whitelist: \"" + siteURI + "\"");
      Services.perms.add(siteURI, "cookie", Ci.nsICookiePermission.ACCESS_ALLOW);
      showToast(window, "Added Site permanently to Cookie Whitelist");
    }
  };
  button_session = {
    label: "Only this session",
    callback: function() {
      dump("Add temporarily to cookie whitelist: \"" + siteURI + "\"");
      Services.perms.add(siteURI, "cookie", Ci.nsICookiePermission.ACCESS_SESSION);
      showToast(window, "Added Site for this session to Cookie Whitelist");
    }
  };
  button_delete = {
    label: "Delete permission",
    callback: function() {
      dump("Remove from cookie whitelist: \"" + siteURI + "\"");
      Services.perms.add(siteURI, "cookie", Ci.nsICookiePermission.ACCESS_DEFAULT);
      showToast(window, "Removed Site from Cookie Whitelist");
    }
  };
  buttons = [];

  switch (Services.perms.testPermission(siteURI, "cookie")) {
    case Ci.nsICookiePermission.ACCESS_SESSION:
      buttons.push(button_allow);
      buttons.push(button_delete);
      break;
    case Ci.nsICookiePermission.ACCESS_ALLOW:
      buttons.push(button_session);
      buttons.push(button_delete);
      break;
    default:
      buttons.push(button_allow);
      buttons.push(button_session);
      // button_delete here could be useful in case of errors
  }
  window.NativeWindow.doorhanger.show("Allow Cookies for this site?", doorhangerID, buttons);
}

var gMenuEntry = null;

function loadIntoWindow(window) {
  if (!window)
    return;

  if (isNativeUI()) {
    gMenuEntry = window.NativeWindow.menu.add(
      "Cookie-Whitelist",
      null,
      function() {
        showDoorhanger(window);
      });
  }
}

function unloadFromWindow(window) {
  if (!window)
    return;

  if (isNativeUI()) {
    window.NativeWindow.menu.remove(gMenuEntry);
  }
}


/**
 * bootstrap.js API
 */
var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function() {
      domWindow.removeEventListener("load", arguments.callee, false);
      loadIntoWindow(domWindow);
    }, false);
  },
  
  onCloseWindow: function(aWindow) {
  },
  
  onWindowTitleChange: function(aWindow, aTitle) {
  }
};

function startup(aData, aReason) {
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Load into any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }

  // Load into any new windows
  wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (aReason == APP_SHUTDOWN)
    return;

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Stop listening for new windows
  wm.removeListener(windowListener);

  // Unload from any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}

function install(aData, aReason) {
}

function uninstall(aData, aReason) {
}
