import { useState, useEffect } from 'react';

const popup = () => {
  const [apiKey, setApiKey] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    // Load saved settings when component mounts
    chrome.storage.sync.get(['apiKey', 'isEnabled'], (result) => {
      if (result.apiKey) setApiKey(result.apiKey);
      if (result.isEnabled !== undefined) setIsEnabled(result.isEnabled);
    });
  }, []);

  const saveSettings = () => {
    chrome.storage.sync.set({
      apiKey,
      isEnabled
    }, () => {
      setStatus('Settings saved!');
      setTimeout(() => setStatus('idle'), 2000);
    });
  };

  const toggleExtension = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.sync.set({ isEnabled: newState }, () => {
      // Send message to content script to update state
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'toggleExtension',
            isEnabled: newState
          });
        }
      });
    });
  };

  const fillCurrentForm = () => {
    setStatus('Filling form...');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'fillForm' }, (response) => {
          if (response && response.success) {
            setStatus('Form filled successfully!');
          } else {
            console.log(response,"err")
            setStatus('Error filling form: ' + (response?.error || 'Unknown error'));
          }
          setTimeout(() => setStatus('idle'), 2000);
        });
      }
    });
  };


  return (
    <div className="p-4 w-80">
      <h1 className="text-2xl font-bold text-center mb-4">Mock Pilot</h1>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="apiKey">
          OpenAI API Key
        </label>
        <input
          id="apiKey"
          type="password"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
        />
      </div>

      <div className="flex items-center mb-4">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isEnabled}
              onChange={toggleExtension}
            />
            <div className={`block w-14 h-8 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${isEnabled ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-3 text-gray-700 font-medium">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </label>
      </div>

      <div className="flex flex-col space-y-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={saveSettings}
        >
          Save Settings
        </button>

        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={fillCurrentForm}
        >
          Fill Current Form
        </button>
      </div>

      {status !== 'idle' && (
        <div className="mt-4 text-center text-sm font-medium text-green-600">
          {status}
        </div>
      )}
    </div>
  )
}

export default popup