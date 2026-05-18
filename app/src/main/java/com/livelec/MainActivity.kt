package com.livelec

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.view.KeyEvent
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Скрываем ActionBar для полноэкранного режима
        supportActionBar?.hide()

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                loadWithOverviewMode = true
                useWideViewPort = true
                setSupportZoom(true)
                builtInZoomControls = true
                displayZoomControls = false
                allowFileAccess = false
                allowContentAccess = true
            }

            webViewClient = WebViewClient()
            webChromeClient = WebChromeClient()

            // 🔥 ВАЖНО: ЗАМЕНИТЕ IP НА ВАШ 🔥
            // Как узнать IP: откройте командную строку (cmd) → введите ipconfig → найдите IPv4-адрес
            // Пример: loadUrl("http://192.168.1.100:5173")

            loadUrl("http://192.168.1.70:5173")  // ← ИЗМЕНИТЕ ЭТОТ IP НА ВАШ
        }

        setContentView(webView)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}