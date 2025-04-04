document.addEventListener('DOMContentLoaded', async () => {
  const bitcoinAddressInput = document.getElementById('bitcoinAddress') as HTMLInputElement;
  const saveButton = document.getElementById('saveButton') as HTMLButtonElement;
  const toggleButton = document.getElementById('toggleConnection') as HTMLButtonElement;
  const statusElement = document.getElementById('connectionStatus') as HTMLDivElement;
  const activeConnectionsElement = document.getElementById('activeConnections') as HTMLDivElement;

  // Load saved bitcoin address
  const { bitcoinAddress = '' } = await chrome.storage.local.get('bitcoinAddress');
  bitcoinAddressInput.value = bitcoinAddress;

  // Check connection status
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    updateUI(response.connected, response.activeConnections);
  });

  // Save bitcoin address
  saveButton.addEventListener('click', async () => {
    const address = bitcoinAddressInput.value.trim();
    await chrome.storage.local.set({ bitcoinAddress: address });
    chrome.runtime.sendMessage({ 
      action: 'updateAddress', 
      address 
    });
    showSaveConfirmation();
  });

  // Toggle connection
  toggleButton.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ action: 'toggleConnection' }, (response) => {
      updateUI(response.connected, response.activeConnections);
    });
  });

  // Update UI based on connection status
  function updateUI(connected: boolean, activeConnections: number) {
    if (connected) {
      statusElement.textContent = 'Connected';
      statusElement.className = 'status connected';
      toggleButton.textContent = 'Disconnect';
    } else {
      statusElement.textContent = 'Disconnected';
      statusElement.className = 'status disconnected';
      toggleButton.textContent = 'Connect';
    }
    
    activeConnectionsElement.textContent = `Active connections: ${activeConnections}`;
  }

  function showSaveConfirmation() {
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Saved!';
    saveButton.disabled = true;
    
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.disabled = false;
    }, 1500);
  }

  // Listen for status updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'statusUpdate') {
      updateUI(message.connected, message.activeConnections);
    }
  });
});