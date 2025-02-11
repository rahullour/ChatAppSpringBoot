package com.creating.chatApplication.controller.rest;

import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.creating.chatApplication.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;



@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        String url = fileService.uploadFile(file);
        return ResponseEntity.ok(url);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam String url) {
        try {
            // Extract object key from the URL
            String objectKey = fileService.extractObjectKeyFromUrl(url);

            // Fetch the file from R2
            S3Object s3Object = fileService.getR2Client().getObject(new GetObjectRequest(fileService.getBucket(), objectKey));
            S3ObjectInputStream inputStream = s3Object.getObjectContent();

            // Read file content into a byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }

            // Convert file content into a ByteArrayResource
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());

            // Get filename and content type
            String filename = fileService.getFilenameFromUrl(url);
            String contentType = s3Object.getObjectMetadata().getContentType();

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
