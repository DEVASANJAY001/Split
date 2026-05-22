package com.davnsindusrties.split;

import android.content.Intent;
import android.util.Log;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;

/**
 * Custom Capacitor plugin for Google Sign-In using the reliable legacy GoogleSignInClient SDK.
 *
 * Tries WEB_CLIENT_ID_FIREBASE (auto-created by Firebase) first.
 * Falls back to WEB_CLIENT_ID_CUSTOM if that also causes status=10.
 */
@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {

    private static final String TAG = "GoogleSignInPlugin";

    // Primary: Firebase auto-created Web Client (used by Firebase Auth internally)
    private static final String WEB_CLIENT_ID_FIREBASE =
        "16306937848-5ke01eo4q885rt03k2pl920ap2upj6b0.apps.googleusercontent.com";

    // Fallback: Manually created "Split" Web Client (registered in google-services.json oauth_client)
    private static final String WEB_CLIENT_ID_CUSTOM =
        "16306937848-8sv3bbv62mh7pn5sg3scjtdkl1tnh7h6.apps.googleusercontent.com";

    private ActivityResultLauncher<Intent> signInLauncher;
    private GoogleSignInClient primaryClient;
    private GoogleSignInClient fallbackClient;
    private boolean usingFallback = false;

    @Override
    public void load() {
        primaryClient = buildClient(WEB_CLIENT_ID_FIREBASE);
        fallbackClient = buildClient(WEB_CLIENT_ID_CUSTOM);

        signInLauncher = bridge.registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                PluginCall savedCall = getSavedCall();
                if (savedCall == null) return;

                try {
                    com.google.android.gms.tasks.Task<GoogleSignInAccount> task =
                        GoogleSignIn.getSignedInAccountFromIntent(result.getData());
                    GoogleSignInAccount account = task.getResult(ApiException.class);
                    String idToken = account.getIdToken();

                    if (idToken != null && !idToken.isEmpty()) {
                        Log.d(TAG, "Sign-in success using " + (usingFallback ? "fallback" : "primary") + " client");
                        JSObject res = new JSObject();
                        res.put("idToken", idToken);
                        savedCall.resolve(res);
                    } else {
                        savedCall.reject("Google Sign-In returned an empty ID token.");
                    }
                } catch (ApiException e) {
                    int statusCode = e.getStatusCode();
                    Log.e(TAG, "ApiException status=" + statusCode + " usingFallback=" + usingFallback);

                    // status=10 (DEVELOPER_ERROR): try the other web client ID automatically
                    if (statusCode == 10 && !usingFallback) {
                        Log.d(TAG, "Primary client failed with DEVELOPER_ERROR, trying fallback client...");
                        usingFallback = true;
                        launchSignIn(fallbackClient);
                    } else {
                        String currentClientId = usingFallback ? WEB_CLIENT_ID_CUSTOM : WEB_CLIENT_ID_FIREBASE;
                        String diagnosticMsg = "Google Sign-In failed [status=" + statusCode + "]: " + e.getMessage()
                            + " | Package: " + getContext().getPackageName()
                            + " | ClientID: " + (currentClientId != null && currentClientId.length() > 10 ? currentClientId.substring(0, 10) + "..." : currentClientId)
                            + " | SHA-1: " + getAppSignatureSha1();
                        usingFallback = false;
                        savedCall.reject(diagnosticMsg);
                    }
                } catch (Exception e) {
                    usingFallback = false;
                    savedCall.reject("Google Sign-In unexpected error: " + e.getMessage() + " | SHA-1: " + getAppSignatureSha1());
                }
            }
        );
    }

    private String getAppSignatureSha1() {
        try {
            android.content.pm.PackageManager pm = getContext().getPackageManager();
            String packageName = getContext().getPackageName();
            android.content.pm.Signature[] signatures;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                android.content.pm.PackageInfo packageInfo = pm.getPackageInfo(packageName, android.content.pm.PackageManager.GET_SIGNING_CERTIFICATES);
                if (packageInfo.signingInfo != null) {
                    signatures = packageInfo.signingInfo.getApkContentsSigners();
                } else {
                    return "No signingInfo";
                }
            } else {
                android.content.pm.PackageInfo packageInfo = pm.getPackageInfo(packageName, android.content.pm.PackageManager.GET_SIGNATURES);
                signatures = packageInfo.signatures;
            }
            if (signatures == null || signatures.length == 0) {
                return "No signatures found";
            }
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-1");
            byte[] publicKey = signatures[0].toByteArray();
            byte[] digest = md.digest(publicKey);
            StringBuilder hexString = new StringBuilder();
            for (int i = 0; i < digest.length; i++) {
                String append = Integer.toHexString(0xFF & digest[i]);
                if (append.length() == 1) hexString.append("0");
                hexString.append(append);
                if (i < digest.length - 1) hexString.append(":");
            }
            return hexString.toString().toUpperCase();
        } catch (Exception e) {
            return "Error getting signature: " + e.getMessage();
        }
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        saveCall(call);
        usingFallback = false;
        launchSignIn(primaryClient);
    }

    private void launchSignIn(GoogleSignInClient client) {
        // Sign out first to always force the account picker dialog
        client.signOut().addOnCompleteListener(task -> {
            Intent signInIntent = client.getSignInIntent();
            signInLauncher.launch(signInIntent);
        });
    }

    private GoogleSignInClient buildClient(String webClientId) {
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build();
        return GoogleSignIn.getClient(getActivity(), gso);
    }
}
