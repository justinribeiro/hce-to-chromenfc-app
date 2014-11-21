var compatibleDevices = [
  {
    deviceName: 'ACR122U USB NFC Reader',
    productId: 0x2200,
    vendorId: 0x072f,
    thumbnailURL: chrome.runtime.getURL('images/acr122u.png')
  },
  {
    deviceName: 'SCL3711 Contactless USB Smart Card Reader',
    productId: 0x5591,
    vendorId: 0x04e6,
    thumbnailURL: chrome.runtime.getURL('images/scl3711.png')
  }
];

var device = null;
var loopInterval = null;
var scanMessage = null;
var states = null;

function haveType4Conversation() {
  console.info("===== JDR - Starting our Type-4 conversation =====");
  
  console.info("Sending APDU SELECT...");
  chrome.nfc.conversation(device, {step: 0}, function(hex, raw, message, check) {
    console.log("Application selected! HCE Response: " + hex);
    
    console.info("Sending CC SELECT...");
    chrome.nfc.conversation(device, {step: 1}, function(hex, raw, message, check) {
      console.log("CAPABILITY CONTAINER Selected! HCE Response: " + hex);
      
      console.info("Sending ReadBinary from CC...");
      chrome.nfc.conversation(device, {step: 2}, function(hex, raw, message, check) {
        console.log("READ CAPABILITY CONTAINER header! HCE Response: " + hex);
      
        console.info("Sending NDEF Select...");
        chrome.nfc.conversation(device, {step: 3}, function(hex, raw, message, check) {
          console.log("NDEF SELECT! HCE Response: " + hex);
          
          console.info("Sending ReadBinary NLEN...");
          chrome.nfc.conversation(device, {step: 4}, function(hex, raw, message, check) {
            console.log("NLEN! HCE Response: " + hex);
            
            console.info("Sending ReadBinary, get NDEF data...");
            chrome.nfc.conversation(device, {step: 5}, function(hex, raw, message, check) {
              
              window.clearInterval(loopInterval);
              
              console.log("NDEF says: " + hex);
              console.log("NDEF text = " + message);

              scanMessage.textContent = message;

              states.selected = 1;
              
              setTimeout(function(){
                states.selected = 0;
                scanMessage.textContent = "";
                loopInterval = setInterval(haveType4Conversation, 1750);
              }, 5000);
            
              console.info("Wrapping up, closing session.");
            });
            
          });
        
        });
        
      });
      
    });
    
  });
}

function showDeviceInfo() {
  var deviceInfo = null;
  for (var i = 0; i < compatibleDevices.length; i++)
    if (device.productId === compatibleDevices[i].productId &&
        device.vendorId === compatibleDevices[i].vendorId)
      deviceInfo = compatibleDevices[i];
    
  if (!deviceInfo)
    return;
  
  var deviceName = document.querySelector('#device-name');
  deviceName.textContent = deviceInfo.deviceName;
  
  var productId = document.querySelector('#device-product-id');
  productId.textContent = deviceInfo.productId;
  
  var vendorId = document.querySelector('#device-vendor-id');
  vendorId.textContent = deviceInfo.vendorId;

  loopInterval = setInterval(haveType4Conversation, 1750);
}

function enumerateDevices() {
  chrome.nfc.findDevices(function(devices) {
    device = devices[0];
    showDeviceInfo();
  });
}

document.addEventListener('DOMContentLoaded', function(){

  enumerateDevices();

  var tabs = document.querySelector('paper-tabs');
  var pages = document.querySelector('core-pages');
  states = document.querySelector('core-animated-pages');

  scanMessage = document.querySelector('#scan-message');

  tabs.addEventListener('core-select',function(){
    pages.selected = tabs.selected;
  });

});


