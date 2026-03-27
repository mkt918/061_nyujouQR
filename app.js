// Dynamic CSS injections
const alertCSS = `
  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = alertCSS;
document.head.appendChild(styleSheet);

// DOM Elements
const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const apiUrlInput = document.getElementById('apiUrl');
const maxLimitInput = document.getElementById('maxLimit');

const resultOverlay = document.getElementById('resultOverlay');
const resultCard = document.getElementById('resultCard');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const readerContainer = document.getElementById('reader-container');

let html5QrCode = null;
let isScanning = false;

// Load config from LocalStorage
apiUrlInput.value = localStorage.getItem('qr_api_url') || '';
maxLimitInput.value = localStorage.getItem('qr_max_limit') || '2';

saveSettingsBtn.addEventListener('click', () => {
  localStorage.setItem('qr_api_url', apiUrlInput.value);
  localStorage.setItem('qr_max_limit', maxLimitInput.value);
  showResult('SUCCESS', '設定が保存されました', '保存完了', 2000);
});

// Sound feedback
const createAudio = (url) => {
    const audio = new Audio(url);
    audio.load();
    return audio;
};
const successSound = createAudio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
const errorSound = createAudio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');

function playSound(type) {
  try {
    if (type === 'SUCCESS') {
      successSound.currentTime = 0;
      successSound.play().catch(()=>{});
    } else {
      errorSound.currentTime = 0;
      errorSound.play().catch(()=>{});
    }
  } catch(e) {}
}

function showResult(type, message, title, autoHideDelay = 3500) {
  resultOverlay.classList.remove('hidden');
  
  setTimeout(() => {
    resultCard.classList.remove('scale-95', 'opacity-0');
    resultCard.classList.add('scale-100', 'opacity-100');
  }, 10);

  resultIcon.className = 'w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-inner';
  
  if (type === 'SUCCESS') {
    resultIcon.classList.add('bg-green-100', 'text-green-500');
    resultIcon.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
    resultTitle.textContent = title || '入場許可';
    resultTitle.className = 'text-3xl font-black mb-3 text-green-600';
    playSound('SUCCESS');
  } else if (type === 'ERROR') {
    resultIcon.classList.add('bg-red-100', 'text-red-500');
    resultIcon.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>';
    resultTitle.textContent = title || '入場不可';
    resultTitle.className = 'text-3xl font-black mb-3 text-red-600';
    playSound('ERROR');
  } else {
    resultIcon.classList.add('bg-blue-50', 'text-blue-500');
    resultIcon.innerHTML = '<svg class="w-12 h-12 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    resultTitle.textContent = title || '照会中';
    resultTitle.className = 'text-3xl font-black mb-3 text-blue-600';
  }
  
  resultMessage.innerHTML = message;

  if (type !== 'INFO') {
    setTimeout(hideResult, autoHideDelay);
  }
}

function hideResult() {
    resultCard.classList.remove('scale-100', 'opacity-100');
    resultCard.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        resultOverlay.classList.add('hidden');
    }, 300);
}

async function handleQrCodeScanned(decodedText) {
  if (isScanning && html5QrCode) {
    // Current state of scanner
    if (html5QrCode.getState() === 2) { 
        await html5QrCode.pause();
    }
    showResult('INFO', 'データをサーバーと通信して<br>照会しています...', '認証中');

    try {
      let dataPayload = { raw: decodedText };
      try {
        dataPayload = JSON.parse(decodedText);
      } catch (e) {
        dataPayload.id = decodedText; // plain text fallback
      }

      dataPayload.maxLimit = parseInt(maxLimitInput.value, 10);
      
      const apiUrl = apiUrlInput.value;
      if (!apiUrl) {
         throw new Error('GAS API URLが設定されていません。上の設定から入力してください。');
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(dataPayload)
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
         showResult('SUCCESS', `<span class="block text-xl font-bold text-gray-800 mb-2">出席番号: ${dataPayload.id || '不明'}</span>本日の入場: ${result.count}人目 / 上限${dataPayload.maxLimit}人`, `入場許可`);
      } else {
         showResult('ERROR', `<span class="block text-xl font-bold text-red-800 mb-2">出席番号: ${dataPayload.id || '不明'}</span>${result.message || 'データが無効です'}`, '受付不可');
      }

    } catch (err) {
      showResult('ERROR', err.message || '通信エラーが発生しました', 'エラー');
    } finally {
      setTimeout(() => {
        if (isScanning && html5QrCode && html5QrCode.getState() === 3) { 
           html5QrCode.resume();
           hideResult();
        }
      }, 3500);
    }
  }
}

startScanBtn.addEventListener('click', async () => {
    try {
        if(!html5QrCode) {
           html5QrCode = new Html5Qrcode("reader");
        }
        
        await html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            handleQrCodeScanned,
            undefined
        );
        isScanning = true;
        
        // UI updates
        cameraPlaceholder.classList.add('hidden');
        startScanBtn.classList.add('hidden');
        stopScanBtn.classList.remove('hidden');
        readerContainer.classList.remove('border-gray-800');
        readerContainer.classList.add('border-blue-500', 'shadow-[0_0_40px_rgba(59,130,246,0.3)]');
        
    } catch (err) {
        showResult('ERROR', 'カメラが見つからないか、ブラウザの使用権限が拒否されました。', 'カメラエラー', 4000);
    }
});

stopScanBtn.addEventListener('click', async () => {
    if (html5QrCode && isScanning) {
        await html5QrCode.stop();
        html5QrCode.clear();
        isScanning = false;
        
        cameraPlaceholder.classList.remove('hidden');
        startScanBtn.classList.remove('hidden');
        stopScanBtn.classList.add('hidden');
        
        readerContainer.classList.add('border-gray-800');
        readerContainer.classList.remove('border-blue-500', 'shadow-[0_0_40px_rgba(59,130,246,0.3)]');
    }
});
