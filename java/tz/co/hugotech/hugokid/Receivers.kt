package tz.co.hugotech.hugokid

import android.app.admin.DeviceAdminReceiver
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/** Simu ikiwashwa upya, Learning Mode inarudi yenyewe */
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

/** Device Admin: mtoto hawezi kufuta HUGO KID bila mzazi */
class AdminReceiver : DeviceAdminReceiver() {
    override fun onDisableRequested(context: Context, intent: Intent): CharSequence =
        "HUGO KID inalinda simu ya mtoto. Mzazi pekee anaweza kuzima ulinzi huu."
}
