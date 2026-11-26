package tz.co.hugotech.hugokid

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

class GuardService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private var lastQuery = 0L
    private var foreground: String? = null
    private var lastBounce = 0L

    private val safePackages = setOf(
        "com.android.systemui",
        "android",
        "com.android.permissioncontroller",
        "com.google.android.permissioncontroller",
        "com.android.phone",
        "com.android.server.telecom",
        "com.android.dialer",
        "com.google.android.dialer",
        "com.android.emergency",
        "com.google.android.apps.safetyhub",
    )

    private val tick = object : Runnable {
        override fun run() {
            try { check() } catch (e: Exception) { }
            handler.postDelayed(this, 1000)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startAsForeground()
        lastQuery = System.currentTimeMillis() - 60_000
        handler.post(tick)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!LearningMode.isOn(this)) {
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    override fun onDestroy() {
        handler.removeCallbacks(tick)
        super.onDestroy()
    }

    private fun startAsForeground() {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel("hk_guard", "Learning Mode", NotificationManager.IMPORTANCE_LOW)
            )
        }
        val open = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val n: Notification = NotificationCompat.Builder(this, "hk_guard")
            .setSmallIcon(R.drawable.ic_stat_hugo)
            .setContentTitle("HUGO KID: Learning Mode")
            .setContentText("Simu iko kwenye hali ya kujifunza")
            .setOngoing(true)
            .setContentIntent(open)
            .build()
        ServiceCompat.startForeground(this, 77, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    }

    @Suppress("DEPRECATION")
    private fun currentForeground(): String? {
        if (!LearningMode.hasUsageAccess(this)) return foreground
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        val events = usm.queryEvents(lastQuery, now)
        val e = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(e)
            if (e.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) foreground = e.packageName
        }
        lastQuery = now
        return foreground
    }

    private fun keyboardPackage(): String? = try {
        Settings.Secure.getString(contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD)?.substringBefore('/')
    } catch (e: Exception) { null }

    private fun check() {
        if (!LearningMode.isOn(this)) { stopSelf(); return }
        val fg = currentForeground() ?: return
        if (System.currentTimeMillis() < LearningMode.pauseUntil(this)) return
        if (fg == packageName || fg in safePackages || fg == keyboardPackage()) return

        val allowed = LearningMode.allowed(this)
        if (allowed.has(fg)) {
            val limitMin = allowed.optInt(fg, 0)
            val used = LearningMode.addUsage(this, fg, 1)
            if (limitMin > 0 && used >= limitMin * 60) bounce("appTimeUp", fg)
        } else {
            bounce("blocked", fg)
        }
    }

    private fun bounce(route: String, pkg: String) {
        val now = System.currentTimeMillis()
        if (now - lastBounce < 1500) return
        lastBounce = now
        val label = try {
            val ai = packageManager.getApplicationInfo(pkg, 0)
            packageManager.getApplicationLabel(ai).toString()
        } catch (e: PackageManager.NameNotFoundException) { pkg }
        val i = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra("hk_route", route)
            putExtra("hk_app", label)
        }
        try { startActivity(i) } catch (e: Exception) { }
    }
}
