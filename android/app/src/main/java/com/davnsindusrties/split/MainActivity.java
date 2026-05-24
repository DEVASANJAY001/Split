package com.davnsindusrties.split;

import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  private static final int PERMISSIONS_REQUEST_CODE = 100;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    EdgeToEdge.enable(this);
    // Register our custom Google Sign-In plugin (Credential Manager).
    // This plugin lives in our own app package so it must be registered manually.
    // It is NOT an npm package so Capacitor won't auto-discover it.
    registerPlugin(GoogleSignInPlugin.class);
    super.onCreate(savedInstanceState);
    requestAppPermissions();
  }

  private void requestAppPermissions() {
    java.util.List<String> permissionsToRequest = new java.util.ArrayList<>();

    if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA)
        != PackageManager.PERMISSION_GRANTED) {
      permissionsToRequest.add(android.Manifest.permission.CAMERA);
    }

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
