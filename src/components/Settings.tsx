import { useState, useEffect } from 'react';
import { IoMdArrowBack } from 'react-icons/io';
import { Link, useNavigate } from 'react-router-dom';
import mockpilot from '../assets/mockpilot.png'
import { models, providers } from '../constants';

const settings = () => {
  const [provider, setProvider] = useState<keyof typeof models>('openai');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState('idle');
  const navigate = useNavigate();

  useEffect(() => {
    chrome.storage.sync.get(['apiKey', 'isEnabled', 'provider', 'model'], (result) => {
      if (result.provider) setProvider(result.provider);
      if (result.model) setModel(result.model);
      if (result.apiKey) setApiKey(result.apiKey);
      if (result.isEnabled !== undefined) setIsEnabled(result.isEnabled);
    });
  }, []);

  const saveSettings = () => {
    chrome.storage.sync.set({
      apiKey,
      isEnabled,
      provider,
      model,
    }, () => {
      console.log(model, "m")
      console.log(provider, "p")
      console.log(apiKey, "a")
      setStatus('Settings saved!');
      setTimeout(() => setStatus('idle'), 2000);

      navigate('/');
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

  return (
    <>
      <div className="p-4 w-80">
        <div className="flex justify-between items-start">
          <div className='flex justify-start gap-2 items-center w-full mb-4 font-semibold tracking-wide text-lg'>
            <Link to='/'>
              <IoMdArrowBack className='w-5 h-5' />
            </Link>
            <span>
              Settings
            </span>
          </div>

          <img src={mockpilot} className=' h-6 w-26' />
        </div>
        <div className="mb-2 flex justify-between items-center gap-2">
          <div className='flex flex-col gap-1 w-full'>
            <label htmlFor="providers" className='block text-gray-700 text-sm font-bold'>Provider</label>
            <select name="providers" id="providers"
              value={provider}
              onChange={(e) => setProvider(e.target.value as keyof typeof models)}
              className='cursor-pointer border rounded-lg px-3 py-2 text-sm w-full focus:border-blue-500 
              focus:ring-2 focus:ring-blue-500'>
              <option value="" className='cursor-pointer'>Select a provider</option>
              {providers.map((p, idx) => (
                <option className='cursor-pointer' key={idx} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className='flex flex-col gap-1 w-full'>
            <label htmlFor="models" className='block text-gray-700 text-sm font-bold'>Model</label>
            <select name="models" id="models"
              disabled={!provider}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className='cursor-pointer border rounded-lg px-3 py-2 text-sm w-full focus:border-blue-500 
              focus:ring-2 focus:ring-blue-500'>

              <option value="">Select a model</option>
              {(models[provider] || []).map((m, index) => (
                <option key={index} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="apiKey">
            API Key
          </label>
          <input
            id="apiKey"
            type="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="..."
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
              <div className={`block w-14 h-6 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-4 rounded-full transition ${isEnabled ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div className="ml-3 text-gray-700 font-medium">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </label>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            disabled={!apiKey || !provider || !model}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 cursor-pointer
          rounded focus:outline-none focus:shadow-outline"
            onClick={saveSettings}
          >
            Save
          </button>

        </div>
        {status !== 'idle' && (
          <div className={`${status.toLowerCase().includes('error') ? ' text-red-600' : 'text-green-600'} 
            mt-4 text-center text-sm font-medium`}>
            {status}
          </div>
        )}
      </div>
    </>
  )
}

export default settings