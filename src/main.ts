import './style.css';
import { Html5Qrcode } from 'html5-qrcode';

// Dynamic CSS injections using TS
const alertCSS = `
  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = alertCSS;
document.head.appendChild(styleSheet);

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl flex flex-col items-center">
    
    <!-- Premium Header -->
    <header class="w-full bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 shadow-lg flex justify-center items-center rounded-b-[2rem] relative z-10">
      <h1 class="text-2xl font-black tracking-widest drop-shadow-md">入場受付システム</h1>
    </header>

    <main class="w-full flex-grow px-5 pt-8 pb-10 flex flex-col gap-8 relative z-0 -mt-4">
      
      <!-- Settings Panel -->
      <section class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <h2 class="text-sm font-bold text-gray-800 flex items-center justify-between border-b pb-3 border-gray-100">
          <span class="flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> 
            システム設定
          </span>
        </h2>
        
        <div class="flex flex-col gap-5">
          <div class="group">
            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">GAS API URL</label>
            <input type="text" id="apiUrl" class="w-full text-sm p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:bg-white transition-all outline-none" placeholder="https://script.google.com/macros/.../exec" />
          </div>
          <div class="group">
            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">1家庭あたりの入場上限数</label>
            <input type="number" id="maxLimit" class="w-full text-sm p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 hover:bg-white transition-all outline-none" value="2" min="1" max="10" />
          </div>
          <button id="saveSettingsBtn" class="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm shadow hover:bg-gray-800 transition-all transform active:scale-[0.98]">
            設定を保存
          </button>
        </div>
      </section>

      <!-- Camera Scanner Area -->
      <section class="flex flex-col items-center w-full mt-2">
        <div id="reader-container" class="w-full bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative flex items-center justify-center border-4 border-gray-800 min-h-[350px] transition-all duration-500">
          <div id="reader" class="w-full absolute inset-0 z-10"></div>
          <div id="cameraPlaceholder" class="text-white text-sm font-medium z-0 pointer-events-none opacity-50 flex flex-col items-center">
            <svg class="w-16 h-16 mx-auto mb-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            カメラを起動してスキャン
          </div>
        </div>
        
        <div class="flex gap-4 mt-8 w-full">
            <button id="startScanBtn" class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-extrabold shadow-[0_8px_30px_rgb(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.5)] transition-all transform active:scale-[0.98] text-lg flex justify-center items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              スキャン開始
            </button>
            <button id="stopScanBtn" class="flex-1 bg-red-500 text-white py-4 rounded-2xl font-extrabold shadow-[0_8px_30px_rgb(239,68,68,0.3)] hidden hover:bg-red-600 transition-all transform active:scale-[0.98] text-lg">
              停止
            </button>
        </div>
      </section>

      <!-- Fixed Notification Overlay Area -->
      <div id="resultOverlay" class="fixed inset-0 z-50 flex items-center justify-center p-6 hidden bg-gray-900/60 backdrop-blur-sm transition-opacity">
        <div id="resultCard" class="bg-white rounded-[2rem] p-8 w-full max-w-[320px] shadow-2xl transform scale-95 opacity-0 transition-all duration-300 flex flex-col items-center text-center">
            <div id="resultIcon" class="w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-inner"></div>
            <h3 id="resultTitle" class="text-3xl font-black mb-3 text-gray-800 tracking-tight"></h3>
            <p id="resultMessage" class="text-base text-gray-500 font-medium leading-relaxed"></p>
        </div>
      </div>

    </main>
  </div>
`;

// DOM Elements
const startScanBtn = document.getElementById('startScanBtn') as HTMLButtonElement;
const stopScanBtn = document.getElementById('stopScanBtn') as HTMLButtonElement;
const saveSettingsBtn = document.getElementById('saveSettingsBtn') as HTMLButtonElement;
const apiUrlInput = document.getElementById('apiUrl') as HTMLInputElement;
const maxLimitInput = document.getElementById('maxLimit') as HTMLInputElement;

const resultOverlay = document.getElementById('resultOverlay') as HTMLDivElement;
const resultCard = document.getElementById('resultCard') as HTMLDivElement;
const resultIcon = document.getElementById('resultIcon') as HTMLDivElement;
const resultTitle = document.getElementById('resultTitle') as HTMLHeadingElement;
const resultMessage = document.getElementById('resultMessage') as HTMLParagraphElement;
const cameraPlaceholder = document.getElementById('cameraPlaceholder') as HTMLDivElement;
const readerContainer = document.getElementById('reader-container') as HTMLDivElement;

let html5QrCode: Html5Qrcode | null = null;
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
const createAudio = (url: string) => {
    const audio = new Audio(url);
    audio.load();
    return audio;
};
const successSound = createAudio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
const errorSound = createAudio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');

function playSound(type: 'SUCCESS' | 'ERROR') {
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

function showResult(type: 'SUCCESS' | 'ERROR' | 'INFO', message: string, title?: string, autoHideDelay = 3500) {
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

async function handleQrCodeScanned(decodedText: string) {
  if (isScanning && html5QrCode) {
    if (html5QrCode.getState() === 2) { // 2 = SCANNING
        await html5QrCode.pause();
    }
    showResult('INFO', 'データをサーバーと通信して<br>照会しています...', '認証中');

    try {
      let dataPayload: any = { raw: decodedText };
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

    } catch (err: any) {
      showResult('ERROR', err.message || '通信エラーが発生しました', 'エラー');
    } finally {
      setTimeout(() => {
        if (isScanning && html5QrCode && html5QrCode.getState() === 3) { // 3 = PAUSED
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
