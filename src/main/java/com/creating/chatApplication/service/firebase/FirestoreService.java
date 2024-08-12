package com.creating.chatApplication.service.firebase;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class FirestoreService {
    @Autowired
    private Firestore firestore;

    public void createUser(String userId, Map<String, Object> userData) {
        firestore.collection("users").document(userId).set(userData);
    }

    public Map<String, Object> getUser(String userId) throws ExecutionException, InterruptedException {
        return firestore.collection("users").document(userId).get().get().getData();
    }
}
