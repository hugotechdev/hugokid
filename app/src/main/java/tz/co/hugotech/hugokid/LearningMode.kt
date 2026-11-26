package tz.co.hugotech.hugokid

import android.app.AppOpsManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Learning Mode: mipangilio inayohifadhiwa na sehemu ya Android.
 * allowed = { "package": dakikaKwaSiku (0 = bila kikomo) }
 */
object LearningMode {
    private const val PREFS = "hk_learning_mode"
    const val HOME_ALIAS = "tz.co.hugotech.hugokid.HomeAlias"

    private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun isOn(ctx: Context): Boolean = prefs(ctx).getBoolean("on", false)

    fun setOn(ctx: Context, on: Boolean) {
        prefs(ctx).edit().putBoolean("on", on).apply()
        val state = if (on) PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        else PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        try {
            ctx.packageManager.setComponentEnabledSetting(
                ComponentName(ctx.packageName, HOME_ALIAS), state, PackageManager.DONT_KILL_APP
            )
        } catch (e: Exception) {
        }
        val svc = Intent(ctx, GuardService::class.java)
        if (on) ContextCompat.startForegroundService(ctx, svc) else ctx.stopService(svc)
    }

    fun allowed(ctx: Context): JSONObject =
        try { JSONObject(prefs(ctx).getString("allowed", "{}") ?: "{}") } catch (e: Exception) { JSONObject() }

    fun setAllowed(ctx: Context, json: String) {
        val ok = try { JSONObject(json); true } catch (e: Exception) { false }
        if (ok) prefs(ctx).edit().putString("allowed", json).apply()
    }

    private fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    fun usage(ctx: Context): JSONObject {
        val p = prefs(ctx)
        if (p.getString("usage_day", "") != today()) return JSONObject()
        return try { JSONObject(p.getString("usage", "{}") ?: "{}") } catch (e: Exception) { JSONObject() }
    }

    /** ongeza sekunde za matumizi ya programu leo; inarudisha jumla */
    fun addUsage(ctx: Context, pkg: String, secs: Int): Int {
        val u = usage(ctx)
        val total = u.optInt(pkg, 0) + secs
        u.put(pkg, total)
        prefs(ctx).edit().putString("usage_day", today()).putString("usage", u.toString()).apply()
        return total
    }

    fun pauseUntil(ctx: Context): Long = prefs(ctx).getLong("pause_until", 0L)
    fun pause(ctx: Context, minutes: Int) {
        prefs(ctx).edit().putLong("pause_until", System.currentTimeMillis() + minutes * 60_000L).apply()
    }

    /* ----- ruhusa ----- */
    fun hasUsageAccess(ctx: Context): Boolean {
        val ops = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
        } else {
            @Suppress("DEPRECATION")
            ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun hasOverlay(ctx: Context): Boolean = Settings.canDrawOverlays(ctx)

    fun isDefaultHome(ctx: Context): Boolean {
        val i = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        val r = ctx.packageManager.resolveActivity(i, PackageManager.MATCH_DEFAULT_ONLY)
        return r?.activityInfo?.packageName == ctx.packageName
    }

    fun adminComponent(ctx: Context) = ComponentName(ctx, AdminReceiver::class.java)

    fun isAdmin(ctx: Context): Boolean {
        val dpm = ctx.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        return dpm.isAdminActive(adminComponent(ctx))
    }
}
