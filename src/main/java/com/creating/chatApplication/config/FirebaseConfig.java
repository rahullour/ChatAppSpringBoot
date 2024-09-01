package com.creating.chatApplication.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Bean
    public Firestore firestore() throws IOException {
        // Path to your service account key file
        String serviceAccountPath = "/home/personal/ChatAppSpringBoot/src/main/resources/wechat-5e447-firebase-adminsdk-dcsei-e95bbc009b.json";

        // Use a service account
        try (InputStream serviceAccount = new FileInputStream(serviceAccountPath)) {
            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setCredentials(credentials)
                    .build();

            // Initialize Firebase App
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            // Create Firestore instance
            FirestoreOptions firestoreOptions = FirestoreOptions.getDefaultInstance()
                    .toBuilder()
                    .setCredentials(credentials)
                    .build();

            return firestoreOptions.getService(); // Return the Firestore instance
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize Firestore: " + e.getMessage(), e);
        }
    }
}
