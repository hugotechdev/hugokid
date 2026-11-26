package tz.co.hugotech.hugokid

import android.app.admin.DeviceAdminReceiver
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/** Restore Learning Mode after reboot. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (LearningMode.isOn(context)) {
            try {
                ContextCompat.startForegroundService(context, Intent(context, GuardService::class.java))
            } catch (e: Exception) {
            }
        }
    }
}

/** Device administrator integration for parental controls. */
class AdminReceiver : DeviceAdminReceiver() {
    override fun onDisableRequested(context: Context, intent: Intent): CharSequence =
        "HUGO KID inalinda simu ya mtoto. Mzazi pekee anaweza kuzima ulinzi huu."
}
