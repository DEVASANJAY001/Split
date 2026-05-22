package com.davnsindusrties.split;

import android.os.CancellationSignal;
import android.content.Intent;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
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
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException;
import java.util.concurrent.Executors;

/**
 * Custom Capacitor plugin that wraps Android Credential Manager for Google Sign-In,
 * with automatic fallback to GoogleSignInClient chooser when Credential Manager has no accounts.
 */
@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {

    // Web Client ID (OAuth client type 3) from google-services.json
    private static final String WEB_CLIENT_ID =
        "16306937848-8sv3bbv62mh7pn5sg3scjtdkl1tnh7h6.apps.googleusercontent.com";

    private ActivityResultLauncher<Intent> googleSignInLauncher;

    @Override
    public void load() {
        googleSignInLauncher = bridge.registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                PluginCall savedCall = getSavedCall();
                if (savedCall == null) return;

                if (result.getResultCode() == android.app.Activity.RESULT_OK) {
                    try {
                        Intent data = result.getData();
                        com.google.android.gms.tasks.Task<GoogleSignInAccount> task =
                            GoogleSignIn.getSignedInAccountFromIntent(data);
                        GoogleSignInAccount account = task.getResult(ApiException.class);
                        String idToken = account.getIdToken();
                        if (idToken != null && !idToken.isEmpty()) {
                            JSObject res = new JSObject();
                            res.put("idToken", idToken);
                            savedCall.resolve(res);
                        } else {
                            savedCall.reject("Google Sign-In: empty ID token received.");
                        }
                    } catch (ApiException e) {
                        savedCall.reject("Google Sign-In failed: " + e.getMessage() + " (Status: " + e.getStatusCode() + ")");
                    }
                } else {
                    savedCall.reject("Google Sign-In was cancelled or failed.");
                }
            }
        );
    }

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
                        // If Credential Manager fails due to missing credentials, trigger legacy fallback
                        String type = e.getType();
                        String message = e.getMessage() != null ? e.getMessage() : "";
                        if (type.endsWith("NoCredentialException") || message.contains("No credentials available")) {
                            getActivity().runOnUiThread(() -> {
                                startLegacySignIn(call);
                            });
                        } else {
                            call.reject(message, type);
                        }
                    }
                }
            );
        } catch (Exception e) {
            call.reject("GoogleSignInPlugin error: " + e.getMessage());
        }
    }

    private void startLegacySignIn(PluginCall call) {
        saveCall(call);
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(WEB_CLIENT_ID)
            .requestEmail()
            .build();
        GoogleSignInClient mGoogleSignInClient = GoogleSignIn.getClient(getActivity(), gso);
        
        // Force account selection dialog by signing out first
        mGoogleSignInClient.signOut().addOnCompleteListener(task -> {
            Intent signInIntent = mGoogleSignInClient.getSignInIntent();
            googleSignInLauncher.launch(signInIntent);
        });
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
