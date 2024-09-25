const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { url } = require('inspector');
const cookiesPath = path.join(__dirname, 'cookies.json');

// حفظ ملفات تعريف الارتباط إلى ملف
function saveCookies() {
  session.defaultSession.cookies.get({})
    .then(cookies => {
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    })
    .catch(err => console.error('Error saving cookies:', err));
}

// استعادة ملفات تعريف الارتباط من ملف
// استعادة ملفات تعريف الارتباط من ملف
function loadCookies() {
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath));
    cookies.forEach(cookie => {
      // حدد عنوان URL بناءً على البيئة التي تعمل عليها
      const url = 'http://localhost:3000'; // يمكنك تعديل هذا حسب الحاجة

      // التحقق من وجود خصائص غير صالحة
      if (cookie.domain && (cookie.domain.startsWith('__Host-') || cookie.domain.startsWith('__Secure-'))) {
        console.error(`Invalid cookie domain for ${cookie.name}: ${cookie.domain}`);
        return;
      }

      // التحقق من وجود بادئات __Host- أو __Secure- والتأكد من الخصائص
      if (cookie.name.startsWith('__Host-')) {
        if (cookie.domain || !cookie.secure) {
          console.error(`Invalid __Host- cookie: ${cookie.name}`);
          return;
        }
      }
      if (cookie.name.startsWith('__Secure-') && !cookie.secure) {
        console.error(`Invalid __Secure- cookie: ${cookie.name}`);
        return;
      }

      // حاول تعيين الكوكي
      session.defaultSession.cookies.set({ ...cookie, url })
        .catch(err => console.error('Error loading cookie:', err));
    });
  }
}




// إنشاء نافذة المتصفح
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  win.loadURL('http://localhost:3000'); // شغل Next.js على localhost

  // إنشاء شريط أدوات مع زر رجوع
  const template = [
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Back',
          click: () => {
            if (win.webContents.navigationHistory.canGoBack()) {
              win.webContents.navigationHistory.goBack();
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // تحميل ملفات تعريف الارتباط عند فتح النافذة
  loadCookies();

  // حفظ ملفات تعريف الارتباط عند إغلاق النافذة
  win.on('closed', saveCookies);
}

app.disableHardwareAcceleration();

// تشغيل التطبيق
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
