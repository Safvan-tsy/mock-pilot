import { useState, useEffect } from 'react';
import mockpilot from '../assets/mockpilot.png'
import { IoMdSettings } from "react-icons/io";
import { Link, useNavigate } from 'react-router-dom';

const popup = () => {
  const [status, setStatus] = useState('idle');
  const navigate = useNavigate();

  useEffect(() => {
    chrome.storage.sync.get(['apiKey', 'isEnabled', 'provider', 'model'], (result) => {
      const key = result.apiKey;
      const enabled = result.isEnabled;
      const provider = result.provider;
      const model = result.model;

      if (!key || enabled === false || !provider || !model) {
        navigate('/settings');
      }
    });
  }, [navigate]);

  const fillCurrentForm = () => {
    setStatus('Filling form...');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'fillForm' }, (response) => {
          if (response && response.success) {
            setStatus('Form filled successfully!');
          } else {
            console.log(response, "err")
            setStatus('Error filling form: ' + (response?.error || 'Unknown error'));
          }
          setTimeout(() => setStatus('idle'), 2000);
        });
      }
    });
  };


  return (
    <div className="p-4 w-80">
      <div className="flex justify-between items-center w-full mb-4">
        <img src={mockpilot} className=' h-14 w-46' />
        <Link to='settings'>
          <IoMdSettings className='w-5 h-5' />
        </Link>
      </div>

      <div className="flex flex-col space-y-4">
        <button
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 cursor-pointer
          rounded focus:outline-none focus:shadow-outline"
          onClick={fillCurrentForm}
        >
          Fill Current Form
        </button>
      </div>

      {status !== 'idle' && (
        <div className={`${status.toLowerCase().includes('error') ? ' text-red-600' : 'text-green-600'} 
            mt-4 text-center text-sm font-medium`}>
          {status}
        </div>
      )}
    </div>
  )
}

export default popup