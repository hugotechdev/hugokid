package tz.co.hugotech.hugokid

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.ActivityManager
import android.app.ActivityOptions
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.MediaStore
import android.provider.Settings
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.Locale

/**
 * HUGO KID - Learn, Play, Grow
 * Sehemu ya Android: WebView ya programu, picha za homework, sauti (TTS),
 * Speech recognition (Speech), na Learning Mode (kuficha na kudhibiti programu).
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private var finishingSetupVisit = false
    private var pageReady = false
    private var pendingRoute: Pair<String, String>? = null

    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var cameraUri: Uri? = null
    private var cameraFile: File? = null

    private var tts: TextToSpeech? = null
    private var ttsReady = false

    private var recognizer: SpeechRecognizer? = null
    private var pendingListenLang: String? = null

    private val pickFiles = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { res ->
        val cb = fileCallback
        fileCallback = null
        if (cb == null) return@registerForActivityResult
        var result: Array<Uri>? = null
        if (res.resultCode == Activity.RESULT_OK) {
            val data = res.data
            val clip = data?.clipData
            val single = data?.data
            if (clip != null && clip.itemCount > 0) {
                result = Array(clip.itemCount) { i -> clip.getItemAt(i).uri }
            } else if (single != null) {
                result = arrayOf(single)
            } else {
                val f = cameraFile
                val u = cameraUri
                if (f != null && u != null && f.exists() && f.length() > 0) result = arrayOf(u)
            }
        }
        cb.onReceiveValue(result)
    }

    private val askMic = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val lang = pendingListenLang
        pendingListenLang = null
        if (granted && lang != null) startListening(lang) else sendSpeech(emptyList())
    }

    private val askNotif = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    /* WebView camera and microphone permissions for calls and recordings. */
    private var pendingWebPerm: PermissionRequest? = null
    private val askMedia = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { res ->
        val req = pendingWebPerm ?: return@registerForActivityResult
        pendingWebPerm = null
        val ok = req.resources.filter {
            (it == PermissionRequest.RESOURCE_AUDIO_CAPTURE && res[Manifest.permission.RECORD_AUDIO] != false &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) ||
            (it == PermissionRequest.RESOURCE_VIDEO_CAPTURE && res[Manifest.permission.CAMERA] != false &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
        }.toTypedArray()
        if (ok.isNotEmpty()) req.grant(ok) else req.deny()
    }

    /* Request camera access before opening the media picker. */
    private var pendingChooser: Pair<Boolean, Array<String>>? = null
    private val askCamera = registerForActivityResult(ActivityResultContracts.RequestPermission()) { _ ->
        val p = pendingChooser
        pendingChooser = null
        if (p != null && !openChooserNow(p.first, p.second)) {
            fileCallback?.onReceiveValue(null)
            fileCallback = null
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        hideSystemBars()

        tts = TextToSpeech(this) { status -> ttsReady = status == TextToSpeech.SUCCESS }

        web = WebView(this)
        setContentView(web)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = true
            textZoom = 100
            setSupportZoom(false)
        }
        web.overScrollMode = WebView.OVER_SCROLL_NEVER

        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                return request.url.host != "appassets.androidplatform.net"
            }

            override fun onPageFinished(view: WebView, url: String) {
                pageReady = true
                pendingRoute?.let { sendRoute(it.first, it.second) }
                pendingRoute = null
            }
        }

        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = filePathCallback
                return openChooser(params.mode == FileChooserParams.MODE_OPEN_MULTIPLE, params.acceptTypes ?: arrayOf())
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    if (request.origin.scheme != "https" || request.origin.host != "appassets.androidplatform.net") {
                        request.deny()
                        return@runOnUiThread
                    }
                    val need = ArrayList<String>()
                    if (request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) need.add(Manifest.permission.RECORD_AUDIO)
                    if (request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) need.add(Manifest.permission.CAMERA)
                    val missing = need.filter { ContextCompat.checkSelfPermission(this@MainActivity, it) != PackageManager.PERMISSION_GRANTED }
                    if (missing.isEmpty()) {
                        val media = request.resources.filter {
                            it == PermissionRequest.RESOURCE_AUDIO_CAPTURE || it == PermissionRequest.RESOURCE_VIDEO_CAPTURE
                        }.toTypedArray()
                        if (media.isEmpty()) request.deny() else request.grant(media)
                    } else {
                        pendingWebPerm?.deny()
                        pendingWebPerm = request
                        askMedia.launch(missing.toTypedArray())
                    }
                }
            }
        }

        web.addJavascriptInterface(Bridge(), "HugoNative")
        web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
        handleRouteIntent(intent)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("(window.HK && HK.back()) ? '1' : '0'") { r ->
                    if (r != "\"1\"" && !LearningMode.isOn(this@MainActivity)) moveTaskToBack(true)
                }
            }
        })

        if (LearningMode.isOn(this)) {
            try { ContextCompat.startForegroundService(this, Intent(this, GuardService::class.java)) } catch (e: Exception) { }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleRouteIntent(intent)
    }

    private fun handleRouteIntent(i: Intent?) {
        if (i == null) return
        val route = i.getStringExtra("hk_route") ?: return
        val app = i.getStringExtra("hk_app") ?: ""
        i.removeExtra("hk_route")
        if (pageReady) sendRoute(route, app) else pendingRoute = route to app
    }

    private fun sendRoute(route: String, app: String) {
        val js = "window.HK && HK.nativeRoute && HK.nativeRoute(${JSONObject.quote(route)}, ${JSONObject.quote(app)})"
        web.evaluateJavascript(js, null)
    }

    private fun openChooser(multiple: Boolean, accept: Array<String>): Boolean {
        val wantsCamera = accept.isEmpty() || accept.any { it.isBlank() || it.startsWith("image") || it.startsWith("video") }
        if (wantsCamera && ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            pendingChooser = multiple to accept
            askCamera.launch(Manifest.permission.CAMERA)
            return true
        }
        return openChooserNow(multiple, accept)
    }

    private fun openChooserNow(multiple: Boolean, accept: Array<String>): Boolean {
        val types = accept.flatMap { it.split(",") }.map { it.trim() }.filter { it.isNotEmpty() }
        val mainType = when {
            types.isEmpty() -> "image/*"
            types.size == 1 -> types[0]
            else -> "*/*"
        }
        val pick = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = mainType
            if (types.size > 1) putExtra(Intent.EXTRA_MIME_TYPES, types.toTypedArray())
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple)
        }
        val camOk = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        val extras = ArrayList<Intent>()
        if (types.any { it.startsWith("video") } && camOk) extras.add(Intent(MediaStore.ACTION_VIDEO_CAPTURE))
        if (types.any { it.startsWith("audio") }) extras.add(Intent(MediaStore.Audio.Media.RECORD_SOUND_ACTION))
        cameraFile = null
        cameraUri = null
        if (camOk && (types.isEmpty() || types.any { it.startsWith("image") })) try {
            val dir = File(cacheDir, "camera").apply { mkdirs() }
            val f = File.createTempFile("hw_", ".jpg", dir)
            cameraFile = f
            val u = FileProvider.getUriForFile(this, "$packageName.files", f)
            cameraUri = u
            val cam = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                putExtra(MediaStore.EXTRA_OUTPUT, u)
                addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            extras.add(cam)
        } catch (e: Exception) {
            cameraFile = null
            cameraUri = null
        }
        val chooser = Intent.createChooser(pick, "Choose a file").apply {
            putExtra(Intent.EXTRA_INITIAL_INTENTS, extras.toTypedArray())
        }
        return try {
            pauseForSetup(3)
            pickFiles.launch(chooser)
            true
        } catch (e: Exception) {
            fileCallback?.onReceiveValue(null)
            fileCallback = null
            false
        }
    }

    /* ---------- Speech recognition ---------- */
    private fun startListening(lang: String) {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) { sendSpeech(emptyList()); return }
        recognizer?.destroy()
        val r = SpeechRecognizer.createSpeechRecognizer(this)
        recognizer = r
        r.setRecognitionListener(object : RecognitionListener {
            override fun onResults(results: Bundle) {
                if (recognizer !== r) return
                val list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) ?: arrayListOf()
                sendSpeech(list)
            }
            override fun onError(error: Int) {
                if (recognizer !== r) return
                if (lang == "en-TZ" && (error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED ||
                        error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE)) {
                    startListening("en-GB")
                } else sendSpeech(emptyList())
            }
            override fun onReadyForSpeech(params: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onPartialResults(partialResults: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
        val tag = when (lang) {
            "en-TZ" -> "en-TZ"; "en-GB" -> "en-GB"; "en" -> "en-US"; "fr" -> "fr-FR"; "zh" -> "zh-CN"; "ar" -> "ar-SA"; else -> "sw-TZ"
        }
        val i = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, tag)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 8)
        }
        r.startListening(i)
    }

    private fun sendSpeech(list: List<String>) {
        val arr = JSONArray()
        list.forEach { arr.put(it) }
        runOnUiThread { web.evaluateJavascript("window.HK_onSpeech && window.HK_onSpeech($arr)", null) }
    }

    private fun hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, true)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.statusBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    override fun onResume() {
        super.onResume()
        if (finishingSetupVisit) {
            LearningMode.pause(this, 0)
            finishingSetupVisit = false
        }
        applyManagedLearningMode()
        if (pageReady) web.evaluateJavascript("window.HK && HK.onResume && HK.onResume()", null)
    }

    override fun onPause() {
        super.onPause()
        web.evaluateJavascript("window.HK && HK.onPause && HK.onPause()", null)
    }

    override fun onDestroy() {
        tts?.stop()
        tts?.shutdown()
        recognizer?.destroy()
        web.destroy()
        super.onDestroy()
    }

    private fun iconBase64(pkg: String): String = try {
        val d = packageManager.getApplicationIcon(pkg)
        val size = 96
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        d.setBounds(0, 0, size, size)
        d.draw(c)
        val out = ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
        "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    } catch (e: Exception) { "" }

    private fun applyManagedLearningMode() {
        val manager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        if (!manager.isDeviceOwnerApp(packageName)) return
        val admin = LearningMode.adminComponent(this)
        val enabled = LearningMode.isOn(this)
        val active = enabled && System.currentTimeMillis() >= LearningMode.pauseUntil(this)
        val apps = LearningMode.allowed(this).keys().asSequence().filterNot { LearningMode.restrictedApp(this, it) }.toList()
        val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        manager.setUninstallBlocked(admin, packageName, enabled)
        if (active) {
            manager.setLockTaskPackages(admin, (apps + packageName).toTypedArray())
            if (activityManager.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_NONE && manager.isLockTaskPermitted(packageName)) {
                startLockTask()
            }
        } else {
            if (activityManager.lockTaskModeState == ActivityManager.LOCK_TASK_MODE_LOCKED) stopLockTask()
            manager.setLockTaskPackages(admin, emptyArray())
        }
    }

    private fun pauseForSetup(minutes: Int) {
        finishingSetupVisit = true
        LearningMode.pause(this, minutes)
        applyManagedLearningMode()
    }

    inner class Bridge {
        private val ctx: Context get() = this@MainActivity

        @JavascriptInterface
        fun isNative(): Boolean = true

        /* Open PDFs and external links. */
        @JavascriptInterface
        fun openUrl(url: String) {
            if (!url.startsWith("https://") && !url.startsWith("http://")) return
            runOnUiThread {
                pauseForSetup(5)
                tryStart(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
        }

        /* ----- Text to speech ----- */
        @JavascriptInterface
        fun speak(text: String, lang: String) {
            val engine = tts ?: return
            if (!ttsReady) return
            val r = engine.setLanguage(Locale.UK)
            if (r < TextToSpeech.LANG_AVAILABLE && engine.setLanguage(Locale.US) < TextToSpeech.LANG_AVAILABLE) return
            engine.setSpeechRate(0.92f)
            engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "hk")
        }

        @JavascriptInterface
        fun stopSpeaking() { tts?.stop() }

        @JavascriptInterface
        fun vibrate(ms: Int) {
            try {
                @Suppress("DEPRECATION")
                val v = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                v.vibrate(VibrationEffect.createOneShot(ms.toLong(), VibrationEffect.DEFAULT_AMPLITUDE))
            } catch (e: Exception) { }
        }

        /* ----- Speech recognition ----- */
        @JavascriptInterface
        fun canListen(): Boolean = SpeechRecognizer.isRecognitionAvailable(ctx)

        @JavascriptInterface
        fun listen(lang: String) {
            runOnUiThread {
                if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                    startListening(lang)
                } else {
                    pendingListenLang = lang
                    askMic.launch(Manifest.permission.RECORD_AUDIO)
                }
            }
        }

        /* ----- Learning Mode ----- */
        @JavascriptInterface
        fun lmState(): String {
            val o = JSONObject()
            o.put("on", LearningMode.isOn(ctx))
            o.put("allowed", LearningMode.allowed(ctx))
            o.put("usage", LearningMode.usage(ctx))
            o.put("usageAccess", LearningMode.hasUsageAccess(ctx))
            o.put("overlay", LearningMode.hasOverlay(ctx))
            o.put("home", LearningMode.isDefaultHome(ctx))
            o.put("admin", LearningMode.isAdmin(ctx))
            val policy = ctx.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            o.put("managed", policy.isDeviceOwnerApp(packageName))
            o.put("paused", System.currentTimeMillis() < LearningMode.pauseUntil(ctx))
            return o.toString()
        }

        @JavascriptInterface
        fun listApps(): String {
            val i = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            val arr = JSONArray()
            val seen = HashSet<String>()
            val list = packageManager.queryIntentActivities(i, 0)
                .sortedBy { it.loadLabel(packageManager).toString().lowercase() }
            for (ri in list) {
                val pkg = ri.activityInfo.packageName
                if (pkg == packageName || LearningMode.restrictedApp(ctx, pkg) || !seen.add(pkg)) continue
                val o = JSONObject()
                o.put("pkg", pkg)
                o.put("name", ri.loadLabel(packageManager).toString())
                o.put("icon", iconBase64(pkg))
                arr.put(o)
            }
            return arr.toString()
        }

        @JavascriptInterface
        fun setAllowed(json: String) { runOnUiThread { LearningMode.setAllowed(ctx, json); applyManagedLearningMode() } }

        @JavascriptInterface
        fun setLearningMode(on: Boolean) {
            runOnUiThread {
                if (on && Build.VERSION.SDK_INT >= 33 &&
                    ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                ) askNotif.launch(Manifest.permission.POST_NOTIFICATIONS)
                LearningMode.setOn(ctx, on)
                applyManagedLearningMode()
            }
        }

        @JavascriptInterface
        fun pauseGuard(minutes: Int) { runOnUiThread { LearningMode.pause(ctx, minutes.coerceIn(0, 30)); applyManagedLearningMode() } }

        /** Returns one of: ok, limit, no. */
        @JavascriptInterface
        fun launchApp(pkg: String): String {
            val allowed = LearningMode.allowed(ctx)
            if (LearningMode.isOn(ctx) && (!allowed.has(pkg) || LearningMode.restrictedApp(ctx, pkg))) return "no"
            val limit = allowed.optInt(pkg, 0)
            if (LearningMode.isOn(ctx) && limit > 0 && LearningMode.usage(ctx).optInt(pkg, 0) >= limit * 60) return "limit"
            val li = packageManager.getLaunchIntentForPackage(pkg) ?: return "no"
            li.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            runOnUiThread {
                try {
                    val policy = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
                    val managed = policy.isDeviceOwnerApp(packageName) && policy.isLockTaskPermitted(pkg)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && managed) {
                        startActivity(li, ActivityOptions.makeBasic().setLockTaskEnabled(true).toBundle())
                    } else {
                        startActivity(li)
                    }
                } catch (_: SecurityException) {
                } catch (_: android.content.ActivityNotFoundException) {
                }
            }
            return "ok"
        }

        @JavascriptInterface
        fun openUsageAccess() {
            runOnUiThread {
                pauseForSetup(5)
                tryStart(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)) }
        }

        @JavascriptInterface
        fun openOverlay() {
            runOnUiThread {
                pauseForSetup(5)
                tryStart(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))) }
        }

        @JavascriptInterface
        fun openHomeSettings() {
            runOnUiThread {
                pauseForSetup(5)
                if (!tryStart(Intent(Settings.ACTION_HOME_SETTINGS))) tryStart(Intent(Settings.ACTION_SETTINGS))
            }
        }

        @JavascriptInterface
        fun requestAdmin() {
            runOnUiThread {
                pauseForSetup(5)
                val i = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                    putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, LearningMode.adminComponent(ctx))
                    putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Inazuia mtoto kufuta HUGO KID bila ruhusa ya mzazi.")
                }
                tryStart(i)
            }
        }

        @JavascriptInterface
        fun removeAdmin() {
            val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            try { dpm.removeActiveAdmin(LearningMode.adminComponent(ctx)) } catch (e: Exception) { }
        }

        private fun tryStart(i: Intent): Boolean = try {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(i); true
        } catch (e: Exception) { false }
    }
}
