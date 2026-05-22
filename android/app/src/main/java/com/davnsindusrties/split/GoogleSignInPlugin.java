package com.davnsindusrties.split;

import android.content.Intent;
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
 * Custom Capacitor plugin for Google Sign-In using the reliable legacy
 * GoogleSignInClient SDK. Credential Manager is bypassed entirely because
 * it throws NoCredentialException on many devices.
 *
 * Flow: signIn() → sign out silently → launch account picker →
 *       onActivityResult → extract idToken → resolve PluginCall
 */
@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {

    // Firebase auto-created Web Client ID — this is the correct server client for requestIdToken().
    // Using a manually-created web client causes DEVELOPER_ERROR (status=10).
    // Found in GCC → OAuth 2.0 Clients → "Web client (auto created by Google Service)"
    private static final String WEB_CLIENT_ID =
        "16306937848-5ke01eo4q885rt03k2pl920ap2upj6b0.apps.googleusercontent.com";

    private ActivityResultLauncher<Intent> signInLauncher;
    private GoogleSignInClient googleSignInClient;

    @Override
    public void load() {
        // Build the sign-in options — request an ID token scoped to the web client
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(WEB_CLIENT_ID)
            .requestEmail()
            .build();

        googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);

        // Register activity result handler once during load()
        signInLauncher = bridge.registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                PluginCall savedCall = getSavedCall();
                if (savedCall == null) return;

                try {
                    // getSignedInAccountFromIntent works for both RESULT_OK and error cases
                    com.google.android.gms.tasks.Task<GoogleSignInAccount> task =
                        GoogleSignIn.getSignedInAccountFromIntent(result.getData());

                    GoogleSignInAccount account = task.getResult(ApiException.class);
                    String idToken = account.getIdToken();

                    if (idToken != null && !idToken.isEmpty()) {
                        JSObject res = new JSObject();
                        res.put("idToken", idToken);
                        savedCall.resolve(res);
                    } else {
                        savedCall.reject("Google Sign-In returned an empty ID token. "
                            + "Ensure the Web Client ID is correct and the SHA-1 is registered in Firebase.");
                    }
                } catch (ApiException e) {
                    // Status codes: 12501=cancelled, 12500=sign_in_failed, 10=developer_error
                    savedCall.reject("Google Sign-In failed [status=" + e.getStatusCode() + "]: " + e.getMessage());
                } catch (Exception e) {
                    savedCall.reject("Google Sign-In unexpected error: " + e.getMessage());
                }
            }
        );
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        saveCall(call);

        // Sign out silently first to always force the account picker dialog
        googleSignInClient.signOut().addOnCompleteListener(task -> {
            Intent signInIntent = googleSignInClient.getSignInIntent();
            signInLauncher.launch(signInIntent);
        });
    }
}
