package com.davnsindusrties.split;

import android.os.CancellationSignal;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException;
import java.util.concurrent.Executors;

/**
 * Custom Capacitor plugin that wraps Android Credential Manager for Google Sign-In.
 * This is Google's recommended approach (since 2023) and is fully Play Store compatible.
 * It requires no third-party npm plugins and has no Firebase JS SDK version conflicts.
 *
 * Web Client ID: The server client ID that identifies this app to Google's OAuth servers.
 * Must match the Web OAuth client registered in Firebase/Google Cloud Console.
 */
@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {

    // Web Client ID (OAuth client type 3) from google-services.json
    // Used by requestIdToken — Google returns an ID token scoped to this client
    private static final String WEB_CLIENT_ID =
        "16306937848-8sv3bbv62mh7pn5sg3scjtdkl1tnh7h6.apps.googleusercontent.com";

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            CredentialManager credentialManager = CredentialManager.create(getContext());

            // Option 1: Standard bottom-sheet
            GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(WEB_CLIENT_ID)
                .setAutoSelectEnabled(false)
                .build();

            // Option 2: Fallback button dialog (explicit Google account picker)
            com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption signInWithGoogleOption = 
                new com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption.Builder(WEB_CLIENT_ID)
                    .build();

            GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .addCredentialOption(signInWithGoogleOption)
                .build();

            credentialManager.getCredentialAsync(
                getActivity(),
                request,
                new CancellationSignal(),
                Executors.newSingleThreadExecutor(),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        try {
                            String idToken = extractIdToken(response);
                            if (idToken != null && !idToken.isEmpty()) {
                                JSObject result = new JSObject();
                                result.put("idToken", idToken);
                                call.resolve(result);
                            } else {
                                call.reject("Google Sign-In failed: empty ID token received.");
                            }
                        } catch (GoogleIdTokenParsingException e) {
                            call.reject("Failed to parse Google ID token: " + e.getMessage());
                        }
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        // User cancelled, no accounts, or other error
                        String msg = e.getMessage() != null
                            ? e.getMessage()
                            : "Google Sign-In was cancelled or failed.";
                        call.reject(msg, e.getType());
                    }
                }
            );
        } catch (Exception e) {
            call.reject("GoogleSignInPlugin error: " + e.getMessage());
        }
    }

    /**
     * Extracts the Google ID token from the credential response.
     * Handles both direct GoogleIdTokenCredential and CustomCredential wrapper types.
     */
    private String extractIdToken(GetCredentialResponse response)
            throws GoogleIdTokenParsingException {
        var credential = response.getCredential();

        // Direct type (newer API levels)
        if (credential instanceof GoogleIdTokenCredential) {
            return ((GoogleIdTokenCredential) credential).getIdToken();
        }

        // CustomCredential wrapper (compatibility path across API levels)
        if (credential instanceof CustomCredential) {
            CustomCredential custom = (CustomCredential) credential;
            if (GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(custom.getType())) {
                return GoogleIdTokenCredential.createFrom(custom.getData()).getIdToken();
            }
        }

        return null;
    }
}
