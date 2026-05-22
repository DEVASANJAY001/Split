package com.davnsindusrties.split;

import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  private static final int PERMISSIONS_REQUEST_CODE = 100;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    // NOTE: Do NOT manually call registerPlugin() here.
    // @capacitor-firebase/authentication uses @CapacitorPlugin annotation
    // and is auto-registered by Capacitor via capacitor.plugins.json.
    // Calling registerPlugin() again causes a double-registration crash on startup.
    super.onCreate(savedInstanceState);
    requestAppPermissions();
  }

  private void requestAppPermissions() {
    java.util.List<String> permissionsToRequest = new java.util.ArrayList<>();

    // Camera
    if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA)
        != PackageManager.PERMISSION_GRANTED) {
      permissionsToRequest.add(android.Manifest.permission.CAMERA);
    }

    // Storage — Android 13+ uses READ_MEDIA_IMAGES, older uses READ_EXTERNAL_STORAGE
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.READ_MEDIA_IMAGES)
          != PackageManager.PERMISSION_GRANTED) {
        permissionsToRequest.add(android.Manifest.permission.READ_MEDIA_IMAGES);
      }
    } else {
      if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.READ_EXTERNAL_STORAGE)
          != PackageManager.PERMISSION_GRANTED) {
        permissionsToRequest.add(android.Manifest.permission.READ_EXTERNAL_STORAGE);
      }
    }

    // Notifications — Android 13+ requires explicit grant
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS)
          != PackageManager.PERMISSION_GRANTED) {
        permissionsToRequest.add(android.Manifest.permission.POST_NOTIFICATIONS);
      }
    }

    if (!permissionsToRequest.isEmpty()) {
      ActivityCompat.requestPermissions(
        this,
        permissionsToRequest.toArray(new String[0]),
        PERMISSIONS_REQUEST_CODE
      );
    }
  }
}
